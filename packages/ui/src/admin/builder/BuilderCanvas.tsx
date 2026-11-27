"use client";

import type { ModuleType } from "@hio/content-model";
import {
  type CSSProperties,
  type DragEvent,
  type ReactNode,
  useEffect,
  useState,
  useTransition,
} from "react";
import { cn } from "../../cn";
import { ModuleRenderer } from "../../modules/ModuleRenderer";
import { packSpans } from "../../modules/SiteSections";
import type { StyleVariant } from "../../style";
import { ConfirmDialog } from "../ConfirmDialog";
import { ChatPanel, type SendOutcome } from "./ChatPanel";
import { COMPONENT_DRAG_TYPE, ComponentList } from "./ComponentToolbar";
import { SectionCard } from "./SectionCard";
import { SectionEditor } from "./SectionEditor";
import { insertIndex, sectionSummary } from "./moduleMeta";

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
 * conversation are visible together. The components a site may add sit in a
 * left-hand toolbar (click to append, drag to place); both side panes
 * collapse to a thin strip. Section cards collapse to a one-line summary,
 * remembered per site in this browser. Manual editing stays inline in the
 * section card, visually demoted. All writes come in as plain function props
 * (each app binds its own server actions and its own ai-command transport),
 * keeping this package Next-free.
 *
 * Layout: at `lg` a three-pane grid (toolbar, canvas, chat) filling the
 * viewport under the 3.5rem AdminShell header (`heightClassName` — Studio
 * overrides it until it gets the shell in PR 4); below `lg` a single column
 * with an "Add a section" disclosure above the canvas and the chat under it,
 * internally scrolled.
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
  /** `atIndex` places the new section before the one at that index;
   *  omitted, it goes at the end. */
  onAdd: (type: ModuleType, atIndex?: number) => Promise<BuilderActionResult>;
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
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [pending, start] = useTransition();

  // Collapsed sections are a per-site, per-browser convenience: read after
  // mount (no SSR mismatch) and tolerate storage being unavailable.
  const collapsedKey = `${chat.storageKey}:collapsed`;
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(collapsedKey);
      const ids: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(ids)) setCollapsed(new Set(ids.filter((v) => typeof v === "string")));
    } catch {
      /* storage blocked or corrupt: start expanded */
    }
  }, [collapsedKey]);
  const saveCollapsed = (next: Set<string>) => {
    setCollapsed(next);
    try {
      window.localStorage.setItem(collapsedKey, JSON.stringify([...next]));
    } catch {
      /* not persisted; still works for this visit */
    }
  };
  const toggleCollapsed = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    saveCollapsed(next);
  };
  const allCollapsed = sections.length > 0 && sections.every((s) => collapsed.has(s.id));

  const run = (fn: () => Promise<BuilderActionResult>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if ("error" in res) setError(res.error);
    });

  const add = (type: string, atIndex?: number) => run(() => onAdd(type as ModuleType, atIndex));
  const dragging = draggingId !== null || draggingType !== null;
  const endDrag = () => {
    setDraggingId(null);
    setDraggingType(null);
    setOverIndex(null);
  };
  /** A drop on the card at `idx`, or at the end (`null`): a toolbar component
   *  is added there; a dragged section moves there. */
  const dropAt = (idx: number | null, e: DragEvent) => {
    e.preventDefault();
    const type = draggingType ?? (e.dataTransfer.getData(COMPONENT_DRAG_TYPE) || null);
    const id = draggingId;
    endDrag();
    if (type) add(type, insertIndex(idx, sections.length));
    else if (id) {
      const to = idx ?? sections.length - 1;
      if (sections[to]?.id !== id) run(() => onMove(id, to));
    }
  };

  const deleting = deletingId ? sections.find((s) => s.id === deletingId) : undefined;
  const labelFor = (type: string) => palette.find((p) => p.type === type)?.label ?? type;
  // Lay the canvas out like the published grid; the section being edited
  // takes a full row so its form has room.
  const spans = packSpans(sections.map((s) => (s.id === editingId ? 12 : (s.width ?? 12))));

  return (
    <div
      className={cn(
        "bg-muted/40",
        "lg:grid lg:grid-cols-[var(--toolbar)_minmax(0,1fr)_var(--chat)]",
        toolbarOpen ? "lg:[--toolbar:240px]" : "lg:[--toolbar:3rem]",
        chatOpen ? "lg:[--chat:380px]" : "lg:[--chat:3rem]",
        heightClassName,
      )}
    >
      {/* Component toolbar — left at lg; a disclosure in the canvas below lg. */}
      {toolbarOpen ? (
        <aside className="hidden min-h-0 flex-col border-r border-border bg-background lg:flex">
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
            <strong className="text-sm">Add a section</strong>
            <button
              type="button"
              onClick={() => setToolbarOpen(false)}
              aria-label="Collapse section list"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              «
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ComponentList
              palette={palette}
              paletteError={paletteError}
              disabled={pending}
              onAdd={(type) => add(type)}
              onDragStart={setDraggingType}
              onDragEnd={endDrag}
            />
            <p className="m-0 px-4 pb-4 text-xs text-muted-foreground">
              Click to add at the end, or drag onto the page to place it.
            </p>
          </div>
        </aside>
      ) : (
        <aside className="hidden border-r border-border bg-background lg:block">
          <button
            type="button"
            onClick={() => setToolbarOpen(true)}
            aria-label="Open section list"
            className="flex h-full w-full flex-col items-center gap-2 pt-3 text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
          >
            <span aria-hidden="true">+</span>
            <span className="[writing-mode:vertical-rl]">Add a section</span>
          </button>
        </aside>
      )}

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

          {/* Below lg the toolbar pane is hidden: the same list, folded. */}
          <details className="my-5 rounded-xl border border-border bg-background lg:hidden">
            <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">
              + Add a section
            </summary>
            <div className="border-t border-border">
              <ComponentList
                palette={palette}
                paletteError={paletteError}
                disabled={pending}
                onAdd={(type) => add(type)}
              />
            </div>
          </details>

          {sections.length > 0 && (
            <div className="my-3 flex justify-end lg:mt-5">
              <button
                type="button"
                onClick={() =>
                  saveCollapsed(allCollapsed ? new Set() : new Set(sections.map((s) => s.id)))
                }
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {allCollapsed ? "Expand all" : "Collapse all"}
              </button>
            </div>
          )}

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
              No sections yet — add one from the list, or just ask the AI.
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
                collapsed={collapsed.has(s.id) && editingId !== s.id}
                summary={sectionSummary(s.type, s.content)}
                onCollapseToggle={() => toggleCollapsed(s.id)}
                disabled={pending}
                isDragging={draggingId === s.id}
                isOver={overIndex === idx}
                onEditToggle={() => {
                  if (editingId !== s.id && collapsed.has(s.id)) toggleCollapsed(s.id);
                  setEditingId(editingId === s.id ? null : s.id);
                }}
                onDelete={() => setDeletingId(s.id)}
                onDragStart={() => setDraggingId(s.id)}
                onDragEnd={endDrag}
                onDragOver={(e) => {
                  if (!dragging) return;
                  e.preventDefault();
                  setOverIndex(idx);
                }}
                onDrop={(e) => dropAt(idx, e)}
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

          {dragging && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(sections.length);
              }}
              onDragLeave={() => setOverIndex(null)}
              onDrop={(e) => dropAt(null, e)}
              className={cn(
                "mt-4 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground",
                overIndex === sections.length ? "border-primary text-foreground" : "border-border",
              )}
            >
              {draggingType ? "Drop here to add it at the end" : "Drop here to move it to the end"}
            </div>
          )}
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
