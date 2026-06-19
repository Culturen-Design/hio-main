"use client";

import type { Json } from "@hio/db";
import { useState, useTransition } from "react";
import { updateContent } from "./actions";

/**
 * Generic editor for the string fields of a module's content. Non-string fields
 * (e.g. links.items, columns) are preserved untouched. Rich per-module editors +
 * AI editing arrive with M2.5.
 */
export function SectionEditor({
  sectionId,
  content,
  onDone,
}: {
  sectionId: string;
  content: Record<string, unknown>;
  onDone: () => void;
}) {
  const stringKeys = Object.entries(content)
    .filter(([, v]) => typeof v === "string")
    .map(([k]) => k);

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(stringKeys.map((k) => [k, content[k] as string])),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const next = { ...content, ...values } as Json;
      const res = await updateContent(sectionId, next);
      if ("error" in res) setError(res.error);
      else onDone();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "1rem" }}>
      {stringKeys.length === 0 && (
        <p style={{ color: "#6b7280", margin: 0 }}>This module has no editable text fields yet.</p>
      )}
      {stringKeys.map((key) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          <label htmlFor={`field-${key}`}>{key}</label>
          {key === "body" ? (
            <textarea
              id={`field-${key}`}
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              rows={4}
              style={{
                padding: "0.5rem",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                font: "inherit",
              }}
            />
          ) : (
            <input
              id={`field-${key}`}
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #d1d5db" }}
            />
          )}
        </div>
      ))}
      {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: 8,
            border: "none",
            background: "#111827",
            color: "white",
            cursor: "pointer",
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "white",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
