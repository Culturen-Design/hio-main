"use client";

import { type ModuleType, selfServeSchema } from "@hio/content-model";
import type { Tables } from "@hio/db";
import { ModuleRenderer, cn } from "@hio/ui";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { SectionEditor } from "./SectionEditor";
import { addModule, deleteSection, moveSection } from "./actions";

type Section = Tables<"sections">;

const btn =
  "cursor-pointer rounded-[6px] border border-border bg-background px-[0.6rem] py-[0.3rem] text-[13px]";

export function BuilderCanvas({
  tenantId,
  site,
  sections,
  allowed,
}: {
  tenantId: string;
  site: { id: string; slug: string };
  sections: Section[];
  allowed: string[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => void fn());

  return (
    <main className="mx-auto max-w-[820px] px-6 py-8 font-sans">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="m-0">Builder</h1>
          <p className="mt-1 mb-0 text-sm text-muted-foreground">
            Editing <code>/{site.slug}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${site.slug}`} target="_blank" className={btn}>
            View public ↗
          </Link>
          <Link href="/dashboard" className={btn}>
            Dashboard
          </Link>
        </div>
      </header>

      <section className="my-5 flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-muted-foreground">Add module:</span>
        {allowed.map((type) => (
          <button
            key={type}
            type="button"
            disabled={pending}
            onClick={() => run(() => addModule(type as ModuleType))}
            className={cn(btn, "bg-muted")}
          >
            + {selfServeSchema.getModule(type as ModuleType)?.label ?? type}
          </button>
        ))}
      </section>

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
              if (id && id !== s.id) run(() => moveSection(id, idx));
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
                  onClick={() => run(() => deleteSection(s.id))}
                >
                  Delete
                </button>
              </div>
            </div>

            {editingId === s.id ? (
              <SectionEditor
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

      <ChatSidebar tenantId={tenantId} siteId={site.id} />
    </main>
  );
}
