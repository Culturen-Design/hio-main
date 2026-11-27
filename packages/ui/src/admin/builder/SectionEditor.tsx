"use client";

import type { ModuleType } from "@hio/content-model";
import { useState, useTransition } from "react";
import { CollectionEditor } from "../../forms/CollectionEditor";
import { COLLECTION_FIELD_REGISTRY, cleanCollectionRows } from "../../forms/collectionFields";
import {
  MODULE_SCALAR_FIELDS,
  type ScalarFormValue,
  applyScalarValues,
  discoverScalarSpecs,
  initialScalarValues,
} from "../../forms/moduleFields";
import { Button } from "../Button";
import { Field, Input, Select, Textarea } from "../Field";

/**
 * Manual editor for a module's content — the SECONDARY editing path (chat is
 * primary), inline in the section card. Driven by the shared field registries:
 * `MODULE_SCALAR_FIELDS` declares every top-level field per module (so OPTIONAL
 * fields a row doesn't carry yet — banner images, intros, CTAs — are still
 * editable) and `COLLECTION_FIELD_REGISTRY` drives the array field of the 6
 * collection modules. Discovery survives only as the fallback for a module
 * type missing from the registry. The write goes through the `onSave` prop —
 * each app binds its own membership-gated server action.
 */
export function SectionEditor({
  type,
  content,
  onSave,
  onDone,
}: {
  type: ModuleType;
  content: Record<string, unknown>;
  onSave: (next: Record<string, unknown>) => Promise<{ ok: true } | { error: string }>;
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

      const res = await onSave(next);
      if ("error" in res) setError(res.error);
      else onDone();
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {nothingEditable && (
        <p className="m-0 text-sm text-muted-foreground">This module has no editable fields yet.</p>
      )}
      {specs.map((f) =>
        f.kind === "toggle" ? (
          <label key={f.key} className="flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={values[f.key] === true}
              onChange={(e) => set(f.key, e.target.checked)}
            />
            {f.label}
          </label>
        ) : (
          <Field key={f.key} label={f.required ? `${f.label} *` : f.label}>
            {f.kind === "textarea" ? (
              <Textarea
                value={(values[f.key] as string) ?? ""}
                maxLength={f.maxLength}
                onChange={(e) => set(f.key, e.target.value)}
                rows={4}
              />
            ) : f.kind === "select" ? (
              <Select
                value={(values[f.key] as string) ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              >
                {!f.required && <option value="">—</option>}
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                type={f.kind === "url" ? "url" : "text"}
                value={(values[f.key] as string) ?? ""}
                maxLength={f.maxLength}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </Field>
        ),
      )}

      {collectionCfg && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {collectionCfg.arrayKey}
          </span>
          <CollectionEditor
            items={items}
            fields={collectionCfg.fields}
            onChange={setItems}
            addLabel={collectionCfg.addLabel}
            emptyLabel={collectionCfg.emptyLabel}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="m-0 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
