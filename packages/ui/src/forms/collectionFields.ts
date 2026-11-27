import type { ModuleType } from "@hio/content-model";
import type { FieldConfig } from "./CollectionEditor";

/**
 * Normalize edited collection rows for Zod validation, shared by both apps'
 * save paths: blank OPTIONAL fields are removed rather than sent as "" (a new
 * draft row initializes every field to "", but z.string().url().optional()
 * only permits undefined), and select fields marked `valueType: "number"` are
 * coerced back from their form-string to a number (e.g. testimonial rating).
 */
export function cleanCollectionRows<T extends Record<string, unknown>>(
  fields: FieldConfig[],
  rows: T[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const cleaned: Record<string, unknown> = { ...row };
    for (const f of fields) {
      const v = cleaned[f.key];
      if (v === "" || v == null) {
        if (!f.required) delete cleaned[f.key];
        continue;
      }
      if (f.valueType === "number" && typeof v === "string") cleaned[f.key] = Number(v);
    }
    return cleaned;
  });
}

/** Which array field on a module's content holds its collection, plus the
 *  per-item field config for CollectionEditor. Only the 6 collection modules
 *  appear here (bio joined in v1.6.0 with its quick-facts list) — modules
 *  without an array field (hero/contact/custom) are absent by design (the
 *  section editor treats absence as "no collection"). Every field key here
 *  matches its Zod schema in `@hio/content-model` exactly — guarded by
 *  `moduleFields.test.ts`. */
export interface CollectionFieldConfig {
  arrayKey: string;
  fields: FieldConfig[];
  addLabel: string;
  emptyLabel: string;
}

export const COLLECTION_FIELD_REGISTRY: Partial<Record<ModuleType, CollectionFieldConfig>> = {
  bio: {
    arrayKey: "facts",
    addLabel: "Add quick fact",
    emptyLabel: "No quick facts yet.",
    fields: [
      { key: "label", label: "Label", kind: "text", maxLength: 40, required: true },
      { key: "value", label: "Value", kind: "text", maxLength: 120, required: true },
    ],
  },
  services: {
    arrayKey: "items",
    addLabel: "Add service",
    emptyLabel: "No services yet.",
    fields: [
      { key: "name", label: "Name", kind: "text", maxLength: 80, required: true },
      { key: "description", label: "Description", kind: "textarea", maxLength: 300 },
      { key: "price", label: "Price", kind: "text", maxLength: 40 },
      { key: "icon", label: "Icon (emoji)", kind: "text", maxLength: 8 },
      { key: "image_url", label: "Image URL", kind: "url" },
      { key: "image_alt", label: "Image alt text", kind: "text", maxLength: 160 },
      { key: "link_url", label: "Link URL", kind: "url" },
      { key: "link_label", label: "Link label", kind: "text", maxLength: 40 },
    ],
  },
  gallery: {
    arrayKey: "images",
    addLabel: "Add image",
    emptyLabel: "No images yet.",
    fields: [
      { key: "url", label: "Image URL", kind: "url", required: true },
      { key: "caption", label: "Caption", kind: "text", maxLength: 160 },
      { key: "alt", label: "Alt text", kind: "text", maxLength: 160 },
    ],
  },
  testimonial: {
    arrayKey: "items",
    addLabel: "Add testimonial",
    emptyLabel: "No testimonials yet.",
    fields: [
      { key: "quote", label: "Quote", kind: "textarea", maxLength: 500, required: true },
      { key: "author", label: "Author", kind: "text", maxLength: 80, required: true },
      { key: "role", label: "Role", kind: "text", maxLength: 120 },
      { key: "avatar_url", label: "Avatar URL", kind: "url" },
      {
        key: "rating",
        label: "Rating",
        kind: "select",
        valueType: "number",
        options: [1, 2, 3, 4, 5].map((n) => ({
          name: `${n} star${n === 1 ? "" : "s"}`,
          value: String(n),
        })),
      },
    ],
  },
  calendar: {
    arrayKey: "events",
    addLabel: "Add event",
    emptyLabel: "No events yet.",
    fields: [
      { key: "title", label: "Title", kind: "text", maxLength: 80, required: true },
      { key: "date", label: "Date", kind: "date", required: true },
      { key: "time", label: "Time", kind: "time" },
      { key: "description", label: "Description", kind: "textarea", maxLength: 300 },
      { key: "location", label: "Location", kind: "text", maxLength: 100 },
      { key: "url", label: "Link URL", kind: "url" },
    ],
  },
  links: {
    arrayKey: "items",
    addLabel: "Add link",
    emptyLabel: "No links yet.",
    fields: [
      { key: "title", label: "Title", kind: "text", maxLength: 60, required: true },
      { key: "url", label: "URL", kind: "url", required: true },
      { key: "description", label: "Description", kind: "text", maxLength: 120 },
      { key: "icon", label: "Icon", kind: "text" },
    ],
  },
};
