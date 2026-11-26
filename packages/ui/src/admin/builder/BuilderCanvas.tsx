"use client";

import type { ModuleType } from "@hio/content-model";
import { type CSSProperties, type ReactNode, useState, useTransition } from "react";
import { cn } from "../../cn";
import { ModuleRenderer } from "../../modules/ModuleRenderer";
import { packSpans } from "../../modules/SiteSections";
import type { StyleVariant } from "../../style";
import { ConfirmDialog } from "../ConfirmDialog";
import { ChatPanel, type SendOutcome } from "./ChatPanel";
import { SectionCard } from "./SectionCard";
import { SectionEditor } from "./SectionEditor";

export type BuilderSection = {
  id: string;
  type: ModuleType;
  content: unknown;
  style_variant: StyleVariant | null;
  /** Columns out of 12 (`sections.width`). */
  width?: number | null;
};

export type BuilderActionResult = { ok: true } | { error: string };

/**
 * The shared builder screen: AI chat is the PRIMARY editing path, so it's a
 * persistent right-hand pane, open by default — the canvas and the
 * conversation are visible together. Manual editing stays inline in the
 * section card, visually demoted. All writes come in as plain function props
 * (each app binds its own server actions and its own ai-command transport),
 * keeping this package Next-free.
 *
 * Layout: at `lg` a two-pane grid filling the viewport under the 3.5rem
 * AdminShell header (`heightClassName` — Studio overrides it until it gets
 * the shell in PR 4); below `lg` a single column with the chat under the
 * canvas, internally scrolled.
 */
export function BuilderCanvas({
  title,
  subtitle,
  headerActions,
  sections,
  palette,
  paletteError = null,
  canvasStyle,
  previewClassName,
  widthRanges,
  heightClassName = "lg:h-[calc(100dvh-3.5rem)]",
  onAdd,
  onDelete,
  onMove,
  onSetWidth,
  onSaveContent,
  chat,
}: {
  title: string;
  subtitle?: ReactNode;
  headerActions?: ReactNode;
  sections: BuilderSection[];
  palette: { type: string; label: string }[];
  paletteError?: string | null;
  /** The site's theme as inline custom properties — applied to the section
   *  previews only, never to the editor's own controls. */
  canvasStyle?: CSSProperties;
  /** Site-style classes (e.g. `site-style-warm-blueprint-brutalism`) so the
   *  previews match the published page. */
  previewClassName?: string;
  /** Allowed width range per module type, from the schema provider. */
  widthRanges?: Partial<Record<string, [number, number]>>;
  heightClassName?: string;
  onAdd: (type: ModuleType) => Promise<BuilderActionResult>;
  onDelete: (sectionId: string) => Promise<BuilderActionResult>;
  onMove: (sectionId: string, toIndex: number) => Promise<BuilderActionResult>;
  /** When given, each section gets a width control (Full / ⅔ / ½ / ⅓). */
  onSetWidth?: (sectionId: string, width: number) => Promise<BuilderActionResult>;
  onSaveContent: (
    sectionId: string,
    type: ModuleType,
    next: Record<string, unknown>,
  ) => Promise<BuilderActionResult>;
  chat: {
    send: (prompt: string) => Promise<SendOutcome>;
    onApplied: () => void;
    onUndo?: (versionId: string) => Promise<{ ok: boolean; message: string }>;
    intro: string;
    storageKey: string;
    suggestions?: string[];
  };
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<BuilderActionResult>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if ("error" in res) setError(res.error);
    });

  const deleting = deletingId ? sections.find((s) => s.id === deletingId) : undefined;
  const labelFor = (type: string) => palette.find((p) => p.type === type)?.label ?? type;
  // Lay the canvas out like the published grid; the section being edited
  // takes a full row so its form has room.
  const spans = packSpans(sections.map((s) => (s.id === editingId ? 12 : (s.width ?? 12))));

  return (
    <div
      className={cn(
        "bg-muted/40",
        chatOpen
          ? "lg:grid lg:grid-cols-[minmax(0,1fr)_380px]"
          : "lg:grid lg:grid-cols-[minmax(0,1fr)_3rem]",
        heightClassName,
      )}
    >
      {/* Canvas pane — scrolls on its own at lg. */}
      <div className="min-w-0 lg:overflow-y-auto">
        <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="m-0 text-xl font-semibold tracking-tight">{title}</h1>
              {subtitle ? (
                <p className="mt-1 mb-0 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {headerActions ? (
              <div className="flex flex-wrap items-center gap-2">{headerActions}</div>
            ) : null}
          </header>

          <section className="my-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Add a section:</span>
            {paletteError ? (
              <span className="text-xs text-destructive">
                Sections can't be added right now. Please reload the page or contact support.
              </span>
            ) : (
              palette.map((m) => (
                <button
                  key={m.type}
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => onAdd(m.type as ModuleType))}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
                >
                  + {m.label}
                </button>
              ))
            )}
          </section>

          {error && (
            // Sticky so it stays in view while you're scrolled down the canvas.
            <p
              role="alert"
              className="sticky top-2 z-10 mb-3 rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm text-destructive shadow-sm"
            >
              {error}
            </p>
          )}

          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No sections yet — add one above, or just ask the AI.
            </p>
          )}

          <div className="grid grid-cols-12 gap-4">
            {sections.map((s, idx) => (
              <SectionCard
                key={s.id}
                type={s.type}
                label={labelFor(s.type)}
                span={spans[idx] ?? 12}
                width={s.width ?? 12}
                widthRange={widthRanges?.[s.type]}
                onSetWidth={onSetWidth ? (w) => run(() => onSetWidth(s.id, w)) : undefined}
                canMoveUp={idx > 0}
                canMoveDown={idx < sections.length - 1}
                onMoveUp={() => run(() => onMove(s.id, idx - 1))}
                onMoveDown={() => run(() => onMove(s.id, idx + 1))}
                editing={editingId === s.id}
                disabled={pending}
                isDragging={draggingId === s.id}
                isOver={overIndex === idx}
                onEditToggle={() => setEditingId(editingId === s.id ? null : s.id)}
                onDelete={() => setDeletingId(s.id)}
                onDragStart={() => setDraggingId(s.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setOverIndex(null);
                }}
                onDragOver={(e) => {
                  if (draggingId === null) return;
                  e.preventDefault();
                  setOverIndex(idx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = draggingId;
                  setDraggingId(null);
                  setOverIndex(null);
                  if (id && id !== s.id) run(() => onMove(id, idx));
                }}
              >
                {editingId === s.id ? (
                  <SectionEditor
                    type={s.type}
                    content={(s.content ?? {}) as Record<string, unknown>}
                    onSave={(next) => onSaveContent(s.id, s.type, next)}
                    onDone={() => setEditingId(null)}
                  />
                ) : (
                  <div
                    className={cn("site-preview @container h-full", previewClassName)}
                    style={canvasStyle}
                  >
                    <ModuleRenderer
                      section={{ type: s.type, content: s.content, style_variant: s.style_variant }}
                    />
                  </div>
                )}
              </SectionCard>
            ))}
          </div>
        </div>
      </div>

      {/* Chat pane — right at lg, below the canvas (internally scrolled) otherwise. */}
      {chatOpen ? (
        <aside className="flex max-h-[60vh] min-h-0 flex-col border-t border-border bg-background lg:max-h-none lg:border-t-0 lg:border-l">
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
            <strong className="text-sm">✨ Edit with AI</strong>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Collapse AI editor"
              className="hidden rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:block"
            >
              »
            </button>
          </header>
          <ChatPanel
            send={chat.send}
            onApplied={chat.onApplied}
            onUndo={chat.onUndo}
            intro={chat.intro}
            storageKey={chat.storageKey}
            suggestions={chat.suggestions}
          />
        </aside>
      ) : (
        <aside className="hidden border-l border-border bg-background lg:block">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            aria-label="Open AI editor"
            className="flex h-full w-full flex-col items-center gap-2 pt-3 text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
          >
            <span aria-hidden="true">✨</span>
            <span className="[writing-mode:vertical-rl]">Edit with AI</span>
          </button>
        </aside>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete this section?"
        description={
          deleting
            ? `The ${labelFor(deleting.type)} section and its content will be removed from your page.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          const id = deletingId;
          setDeletingId(null);
          if (id) run(() => onDelete(id));
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
