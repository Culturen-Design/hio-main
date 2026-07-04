"use client";

import type { ModuleType } from "@hio/content-model";
import { ModuleRenderer, type StyleVariant } from "@hio/ui";
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

const btn: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
  fontSize: 13,
};

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
          <h1 style={{ margin: 0 }}>{clientName}</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: 14 }}>
            Builder · schema <code>{schemaVariant}</code>
          </p>
        </div>
        <a href={`/clients/${tenantId}`} style={btn}>
          ← Client
        </a>
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
        {paletteError ? (
          <span style={{ fontSize: 13, color: "#dc2626" }}>
            Unknown schema variant “{paletteError}” — no modules available.
          </span>
        ) : (
          palette.map((m) => (
            <button
              key={m.type}
              type="button"
              disabled={pending}
              onClick={() => run(() => addSection(tenantId, m.type as ModuleType))}
              style={{ ...btn, background: "#f3f4f6" }}
            >
              + {m.label}
            </button>
          ))
        )}
      </section>

      {error && (
        <p role="alert" style={{ color: "#dc2626", fontSize: 13 }}>
          {error}
        </p>
      )}

      {sections.length === 0 && <p style={{ color: "#9ca3af" }}>No modules yet — add one above.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
            style={{
              border: overIndex === idx ? "1px solid #111827" : "1px solid #e5e7eb",
              borderRadius: 14,
              overflow: "hidden",
              opacity: draggingId === s.id ? 0.5 : 1,
            }}
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  aria-label={`Drag to reorder ${s.type}`}
                  draggable={!pending}
                  onDragStart={() => setDraggingId(s.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverIndex(null);
                  }}
                  style={{
                    cursor: "grab",
                    color: "#9ca3af",
                    fontSize: 14,
                    lineHeight: 1,
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  ⠿
                </button>
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
              </div>
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
                  style={{ ...btn, color: "#dc2626" }}
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
