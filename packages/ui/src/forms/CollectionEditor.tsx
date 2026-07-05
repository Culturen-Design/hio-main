"use client";

import { cn } from "../cn";

export type FieldKind = "text" | "textarea" | "url" | "date" | "time";

export interface FieldConfig {
  key: string;
  label: string;
  kind: FieldKind;
  maxLength?: number;
  required?: boolean;
}

type Row = Record<string, unknown> & { id: string };

/**
 * Generic, presentational editor for a collection (array-of-objects) field —
 * services/gallery/testimonial/calendar/links. Purely local React state; the
 * caller owns persistence (passes the current `items`, gets `onChange(next)`
 * on every add/edit/remove, and decides when/how to save — mirrors
 * SectionEditor's single Save button, not per-row autosave).
 *
 * No drag-reorder here — only whole sections reorder (the builder canvas's
 * drag handle); item order within a collection is add-order.
 */
export function CollectionEditor({
  items,
  fields,
  onChange,
  addLabel = "Add item",
  emptyLabel = "No items yet.",
}: {
  items: Row[];
  fields: FieldConfig[];
  onChange: (next: Row[]) => void;
  addLabel?: string;
  emptyLabel?: string;
}) {
  function addDraft() {
    const draft: Row = { id: crypto.randomUUID() };
    for (const f of fields) draft[f.key] = "";
    onChange([...items, draft]);
  }

  function patch(id: string, key: string, value: string) {
    onChange(items.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function remove(id: string) {
    onChange(items.filter((row) => row.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && <p className="m-0 text-muted-foreground">{emptyLabel}</p>}

      {items.map((row) => (
        <div key={row.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1 text-[13px]">
              <label htmlFor={`${row.id}-${f.key}`}>
                {f.label}
                {f.required && " *"}
              </label>
              {f.kind === "textarea" ? (
                <textarea
                  id={`${row.id}-${f.key}`}
                  value={(row[f.key] as string) ?? ""}
                  maxLength={f.maxLength}
                  onChange={(e) => patch(row.id, f.key, e.target.value)}
                  rows={3}
                  className="rounded-lg border border-border p-2 font-[inherit]"
                />
              ) : (
                <input
                  id={`${row.id}-${f.key}`}
                  type={
                    f.kind === "url"
                      ? "url"
                      : f.kind === "date"
                        ? "date"
                        : f.kind === "time"
                          ? "time"
                          : "text"
                  }
                  value={(row[f.key] as string) ?? ""}
                  maxLength={f.maxLength}
                  onChange={(e) => patch(row.id, f.key, e.target.value)}
                  className="rounded-lg border border-border p-2"
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => remove(row.id)}
            className={cn(
              "cursor-pointer self-start rounded-[6px] border border-border bg-background px-2.5 py-1 text-[12px] text-destructive",
            )}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addDraft}
        className="cursor-pointer self-start rounded-lg border border-border bg-muted px-3 py-1.5 text-[13px]"
      >
        + {addLabel}
      </button>
    </div>
  );
}
