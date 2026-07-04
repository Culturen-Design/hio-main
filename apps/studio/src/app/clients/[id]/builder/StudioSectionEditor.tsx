"use client";

import type { Json } from "@hio/db";
import { useState, useTransition } from "react";
import { updateSectionContent } from "./actions";

/**
 * Generic editor for the string fields of a section's content (non-string fields are
 * preserved untouched). Mirrors Self-Serve's editor but writes through the Studio,
 * membership-gated action. Rich per-module + AI editing arrive with M4.5.
 */
export function StudioSectionEditor({
  tenantId,
  sectionId,
  content,
  onDone,
}: {
  tenantId: string;
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
      const res = await updateSectionContent(tenantId, sectionId, next);
      if ("error" in res) setError(res.error);
      else onDone();
    });
  }

  return (
    <div className="flex flex-col gap-[0.6rem] p-4">
      {stringKeys.length === 0 && (
        <p className="m-0 text-muted-foreground">This module has no editable text fields yet.</p>
      )}
      {stringKeys.map((key) => (
        <div key={key} className="flex flex-col gap-1 text-[13px]">
          <label htmlFor={`field-${key}`}>{key}</label>
          {key === "body" ? (
            <textarea
              id={`field-${key}`}
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              rows={4}
              className="rounded-lg border border-border p-2 font-[inherit]"
            />
          ) : (
            <input
              id={`field-${key}`}
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              className="rounded-lg border border-border p-2"
            />
          )}
        </div>
      ))}
      {error && <p className="m-0 text-[13px] text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="cursor-pointer rounded-lg border-none bg-primary px-3.5 py-[0.45rem] text-primary-foreground"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="cursor-pointer rounded-lg border border-border bg-background px-3.5 py-[0.45rem]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
