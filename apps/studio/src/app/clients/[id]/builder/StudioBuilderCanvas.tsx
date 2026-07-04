"use client";

import type { ModuleType } from "@hio/content-model";
import { ModuleRenderer, type StyleVariant, cn } from "@hio/ui";
import { useState, useTransition } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { StudioSectionEditor } from "./StudioSectionEditor";
import { addSection, deleteSection, moveSection } from "./actions";

type Section = {
  id: string;
  type: ModuleType;
  content: unknown;
  style_variant: StyleVariant | null;
  width: number;
  order: number;
};

const btn =
  "cursor-pointer rounded-[6px] border border-border bg-background px-[0.6rem] py-[0.3rem] text-[13px]";

export function StudioBuilderCanvas({
  tenantId,
  siteId,
  clientName,
  schemaVariant,
  sections,
  palette,
  paletteError,
}: {
  tenantId: string;
  siteId: string;
  clientName: string;
  schemaVariant: string;
  sections: Section[];
  palette: { type: string; label: string }[];
  paletteError: string | null;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true } | { error: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if ("error" in res) setError(res.error);
    });

  return (
    <main className="mx-auto max-w-[820px] px-6 py-8 font-sans">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="m-0">{clientName}</h1>
          <p className="mt-1 mb-0 text-sm text-muted-foreground">
            Builder · schema <code>{schemaVariant}</code>
          </p>
        </div>
        <a href={`/clients/${tenantId}`} className={btn}>
          ← Client
        </a>
      </header>

      <section className="my-5 flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-muted-foreground">Add module:</span>
        {paletteError ? (
          <span className="text-[13px] text-destructive">
            Unknown schema variant “{paletteError}” — no modules available.
          </span>
        ) : (
          palette.map((m) => (
            <button
              key={m.type}
              type="button"
              disabled={pending}
              onClick={() => run(() => addSection(tenantId, m.type as ModuleType))}
              className={cn(btn, "bg-muted")}
            >
              + {m.label}
            </button>
          ))
        )}
      </section>

      {error && (
        <p role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      )}

      {sections.length === 0 && (
        <p className="text-muted-foreground">No modules yet — add one above.</p>
      )}

      <div className="flex flex-col gap-4">
        {sections.map((s, idx) => (
          <div
            key={s.id}
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
              if (id && id !== s.id) run(() => moveSection(tenantId, id, idx));
            }}
            className={cn(
              "overflow-hidden rounded-[14px] border",
              overIndex === idx ? "border-foreground" : "border-border",
              draggingId === s.id && "opacity-50",
            )}
          >
            <div className="flex items-center justify-between border-[#eee] border-b bg-[#fafafa] px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Drag to reorder ${s.type}`}
                  draggable={!pending}
                  onDragStart={() => setDraggingId(s.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverIndex(null);
                  }}
                  className="cursor-grab border-none bg-transparent p-0 text-sm text-muted-foreground leading-none"
                >
                  ⠿
                </button>
                <span className="font-semibold text-muted-foreground text-xs uppercase">
                  {s.type}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className={btn}
                  disabled={pending}
                  onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                >
                  {editingId === s.id ? "Close" : "Edit"}
                </button>
                <button
                  type="button"
                  className={cn(btn, "text-destructive")}
                  disabled={pending}
                  onClick={() => run(() => deleteSection(tenantId, s.id))}
                >
                  Delete
                </button>
              </div>
            </div>

            {editingId === s.id ? (
              <StudioSectionEditor
                tenantId={tenantId}
                sectionId={s.id}
                content={(s.content ?? {}) as Record<string, unknown>}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <ModuleRenderer
                section={{ type: s.type, content: s.content, style_variant: s.style_variant }}
              />
            )}
          </div>
        ))}
      </div>

      <ChatSidebar tenantId={tenantId} siteId={siteId} />
    </main>
  );
}
