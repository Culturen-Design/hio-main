"use client";

import type { ModuleType } from "@hio/content-model";
import type { Json } from "@hio/db";
import {
  COLLECTION_FIELD_REGISTRY,
  CollectionEditor,
  MODULE_SCALAR_FIELDS,
  type ScalarFormValue,
  applyScalarValues,
  cleanCollectionRows,
  discoverScalarSpecs,
  initialScalarValues,
} from "@hio/ui";
import { useState, useTransition } from "react";
import { updateSectionContent } from "./actions";

/**
 * Editor for a section's content, driven by the shared field registries in
 * `@hio/ui` (`MODULE_SCALAR_FIELDS` for top-level fields — so OPTIONAL fields
 * a row doesn't carry yet are still editable — and `COLLECTION_FIELD_REGISTRY`
 * for the array field of the 6 collection modules). Mirrors Self-Serve's
 * editor but writes through the Studio, membership-gated action. Discovery
 * survives only as the fallback for a module type missing from the registry.
 */
export function StudioSectionEditor({
  tenantId,
  sectionId,
  type,
  content,
  onDone,
}: {
  tenantId: string;
  sectionId: string;
  type: ModuleType;
  content: Record<string, unknown>;
  onDone: () => void;
}) {
  const specs = MODULE_SCALAR_FIELDS[type] ?? discoverScalarSpecs(content);

  const collectionCfg = COLLECTION_FIELD_REGISTRY[type];
  const initialItems = collectionCfg
    ? ((content[collectionCfg.arrayKey] as (Record<string, unknown> & { id: string })[]) ?? [])
    : [];

  const [values, setValues] = useState<Record<string, ScalarFormValue>>(() =>
    initialScalarValues(specs, content),
  );
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const nothingEditable = specs.length === 0 && !collectionCfg;
  const set = (key: string, value: ScalarFormValue) => setValues((v) => ({ ...v, [key]: value }));

  function save() {
    start(async () => {
      // Blank optional fields are OMITTED, not sent as "" — z.string().url()
      // .optional() rejects an empty string (optional only permits undefined) —
      // and select values are coerced back to numbers where the schema wants
      // them. Both handled by the shared helpers.
      const next = applyScalarValues(specs, content, values);
      if (collectionCfg) {
        next[collectionCfg.arrayKey] = cleanCollectionRows(collectionCfg.fields, items);
      }

      const res = await updateSectionContent(tenantId, sectionId, type, next as Json);
      if ("error" in res) setError(res.error);
      else onDone();
    });
  }

  return (
    <div className="flex flex-col gap-[0.6rem] p-4">
      {nothingEditable && (
        <p className="m-0 text-muted-foreground">This module has no editable fields yet.</p>
      )}
      {specs.map((f) =>
        f.kind === "toggle" ? (
          <label key={f.key} className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={values[f.key] === true}
              onChange={(e) => set(f.key, e.target.checked)}
            />
            {f.label}
          </label>
        ) : (
          <div key={f.key} className="flex flex-col gap-1 text-[13px]">
            <label htmlFor={`field-${f.key}`}>
              {f.label}
              {f.required && " *"}
            </label>
            {f.kind === "textarea" ? (
              <textarea
                id={`field-${f.key}`}
                value={(values[f.key] as string) ?? ""}
                maxLength={f.maxLength}
                onChange={(e) => set(f.key, e.target.value)}
                rows={4}
                className="rounded-lg border border-border p-2 font-[inherit]"
              />
            ) : f.kind === "select" ? (
              <select
                id={`field-${f.key}`}
                value={(values[f.key] as string) ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                className="rounded-lg border border-border p-2"
              >
                {!f.required && <option value="">—</option>}
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`field-${f.key}`}
                type={f.kind === "url" ? "url" : "text"}
                value={(values[f.key] as string) ?? ""}
                maxLength={f.maxLength}
                onChange={(e) => set(f.key, e.target.value)}
                className="rounded-lg border border-border p-2"
              />
            )}
          </div>
        ),
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
