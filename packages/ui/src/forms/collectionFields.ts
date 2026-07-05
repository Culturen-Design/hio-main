import type { ModuleType } from "@hio/content-model";
import type { FieldConfig } from "./CollectionEditor";

/** Which array field on a module's content holds its collection, plus the
 *  per-item field config for CollectionEditor. Only the 5 collection modules
 *  appear here — modules without an array field (hero/bio/contact/custom)
 *  are absent by design (the section editor treats absence as "no collection").
 *  Every field key here matches its Zod schema in `@hio/content-model` exactly. */
export interface CollectionFieldConfig {
  arrayKey: string;
  fields: FieldConfig[];
  addLabel: string;
  emptyLabel: string;
}

export const COLLECTION_FIELD_REGISTRY: Partial<Record<ModuleType, CollectionFieldConfig>> = {
  services: {
    arrayKey: "items",
    addLabel: "Add service",
    emptyLabel: "No services yet.",
    fields: [
      { key: "name", label: "Name", kind: "text", maxLength: 80, required: true },
      { key: "description", label: "Description", kind: "textarea", maxLength: 300 },
      { key: "price", label: "Price", kind: "text", maxLength: 40 },
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
