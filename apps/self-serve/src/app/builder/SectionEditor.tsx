"use client";

import type { ModuleType } from "@hio/content-model";
import type { Json } from "@hio/db";
import { COLLECTION_FIELD_REGISTRY, CollectionEditor } from "@hio/ui";
import { useState, useTransition } from "react";
import { updateContent } from "./actions";

/**
 * Editor for a module's content: string/boolean top-level fields, the
 * `columns` field (a closed 2|3|4 union on gallery/links, not a free number),
 * and — for the 5 collection modules — the array field itself via a generic
 * CollectionEditor. `columns` is matched by name rather than sniffed from its
 * runtime type, since it's the only such field across all 9 modules today.
 */
export function SectionEditor({
  sectionId,
  type,
  content,
  onDone,
}: {
  sectionId: string;
  type: ModuleType;
  content: Record<string, unknown>;
  onDone: () => void;
}) {
  const stringKeys = Object.entries(content)
    .filter(([k, v]) => typeof v === "string" && k !== "columns")
    .map(([k]) => k);
  const boolKeys = Object.entries(content)
    .filter(([, v]) => typeof v === "boolean")
    .map(([k]) => k);
  const hasColumns = typeof content.columns === "number";

  const collectionCfg = COLLECTION_FIELD_REGISTRY[type];
  const initialItems = collectionCfg
    ? ((content[collectionCfg.arrayKey] as (Record<string, unknown> & { id: string })[]) ?? [])
    : [];

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(stringKeys.map((k) => [k, content[k] as string])),
  );
  const [bools, setBools] = useState<Record<string, boolean>>(
    Object.fromEntries(boolKeys.map((k) => [k, content[k] as boolean])),
  );
  const [columns, setColumns] = useState<number>((content.columns as number) ?? 2);
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const nothingEditable =
    stringKeys.length === 0 && boolKeys.length === 0 && !hasColumns && !collectionCfg;

  function save() {
    start(async () => {
      const next: Record<string, unknown> = { ...content, ...values, ...bools };
      if (hasColumns) next.columns = columns;
      // Optional fields (e.g. a URL) left blank must be OMITTED, not sent as "" —
      // z.string().url().optional() rejects an empty string (optional only
      // permits undefined), so a blank optional field would otherwise fail
      // validation even though the user never touched it.
      if (collectionCfg) {
        const optionalKeys = collectionCfg.fields.filter((f) => !f.required).map((f) => f.key);
        next[collectionCfg.arrayKey] = items.map((item) => {
          const cleaned = { ...item };
          for (const k of optionalKeys) {
            if (cleaned[k] === "") delete cleaned[k];
          }
          return cleaned;
        });
      }

      const res = await updateContent(sectionId, type, next as Json);
      if ("error" in res) setError(res.error);
      else onDone();
    });
  }

  return (
    <div className="flex flex-col gap-[0.6rem] p-4">
      {nothingEditable && (
        <p className="m-0 text-muted-foreground">This module has no editable fields yet.</p>
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

      {boolKeys.map((key) => (
        <label key={key} className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={bools[key] ?? false}
            onChange={(e) => setBools((b) => ({ ...b, [key]: e.target.checked }))}
          />
          {key}
        </label>
      ))}

      {hasColumns && (
        <div className="flex flex-col gap-1 text-[13px]">
          <label htmlFor="field-columns">columns</label>
          <select
            id="field-columns"
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            className="rounded-lg border border-border p-2"
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
      )}

      {collectionCfg && (
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-muted-foreground">{collectionCfg.arrayKey}</span>
          <CollectionEditor
            items={items}
            fields={collectionCfg.fields}
            onChange={setItems}
            addLabel={collectionCfg.addLabel}
            emptyLabel={collectionCfg.emptyLabel}
          />
        </div>
      )}

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
