"use client";

import type { ModuleType } from "@hio/content-model";
import { type CSSProperties, type ReactNode, useState, useTransition } from "react";
import { cn } from "../../cn";
import { ModuleRenderer } from "../../modules/ModuleRenderer";
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
  heightClassName = "lg:h-[calc(100dvh-3.5rem)]",
  onAdd,
  onDelete,
  onMove,
  onSaveContent,
  chat,
}: {
  title: string;
  subtitle?: ReactNode;
  headerActions?: ReactNode;
  sections: BuilderSection[];
  palette: { type: string; label: string }[];
  paletteError?: string | null;
  canvasStyle?: CSSProperties;
  heightClassName?: string;
  onAdd: (type: ModuleType) => Promise<BuilderActionResult>;
  onDelete: (sectionId: string) => Promise<BuilderActionResult>;
  onMove: (sectionId: string, toIndex: number) => Promise<BuilderActionResult>;
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
        <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-6" style={canvasStyle}>
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
            <span className="text-xs text-muted-foreground">Add module:</span>
            {paletteError ? (
              <span className="text-xs text-destructive">
                Unknown schema variant “{paletteError}” — no modules available.
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
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No modules yet — add one above, or just ask the AI.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {sections.map((s, idx) => (
              <SectionCard
                key={s.id}
                type={s.type}
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
                  <ModuleRenderer
                    section={{ type: s.type, content: s.content, style_variant: s.style_variant }}
                  />
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
            className="flex h-full w-full items-start justify-center pt-3 text-sm hover:bg-muted"
          >
            ✨
          </button>
        </aside>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete this section?"
        description={
          deleting
            ? `The ${deleting.type} section and its content will be removed from your page.`
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
