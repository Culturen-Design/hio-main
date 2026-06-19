"use client";

import { type ModuleType, selfServeSchema } from "@hio/content-model";
import type { Tables } from "@hio/db";
import { ModuleRenderer } from "@hio/ui";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { SectionEditor } from "./SectionEditor";
import { addModule, deleteSection, moveSection } from "./actions";

type Section = Tables<"sections">;
type Page = Tables<"pages">;

const btn: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
  fontSize: 13,
};

export function BuilderCanvas({
  page,
  sections,
  allowed,
}: {
  page: Page;
  sections: Section[];
  allowed: string[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => void fn());

  return (
    <main
      style={{ fontFamily: "system-ui", maxWidth: 820, margin: "0 auto", padding: "2rem 1.5rem" }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Builder</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: 14 }}>
            Editing <code>/{page.slug}</code>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href={`/${page.slug}`} target="_blank" style={btn}>
            View public ↗
          </Link>
          <Link href="/dashboard" style={btn}>
            Dashboard
          </Link>
        </div>
      </header>

      <section
        style={{
          margin: "1.25rem 0",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "#6b7280" }}>Add module:</span>
        {allowed.map((type) => (
          <button
            key={type}
            type="button"
            disabled={pending}
            onClick={() => run(() => addModule(type as ModuleType))}
            style={{ ...btn, background: "#f3f4f6" }}
          >
            + {selfServeSchema.getModule(type as ModuleType)?.label ?? type}
          </button>
        ))}
      </section>

      {sections.length === 0 && <p style={{ color: "#9ca3af" }}>No modules yet — add one above.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {sections.map((s, idx) => (
          <div
            key={s.id}
            style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0.75rem",
                background: "#fafafa",
                borderBottom: "1px solid #eee",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "#6b7280",
                }}
              >
                {s.type}
              </span>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  type="button"
                  style={btn}
                  disabled={pending}
                  onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                >
                  {editingId === s.id ? "Close" : "Edit"}
                </button>
                <button
                  type="button"
                  style={btn}
                  disabled={pending || idx === 0}
                  onClick={() => run(() => moveSection(s.id, "up"))}
                >
                  ↑
                </button>
                <button
                  type="button"
                  style={btn}
                  disabled={pending || idx === sections.length - 1}
                  onClick={() => run(() => moveSection(s.id, "down"))}
                >
                  ↓
                </button>
                <button
                  type="button"
                  style={{ ...btn, color: "#dc2626" }}
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

      <ChatSidebar pageId={page.id} />
    </main>
  );
}
