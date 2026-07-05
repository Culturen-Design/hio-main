import type { ModuleType } from "@hio/content-model";

/**
 * Per-module registry of TOP-LEVEL (scalar) content fields for the manual
 * section editors, mirroring `collectionFields.ts` for collection items. The
 * editors previously auto-discovered fields from the content object's own keys
 * (`typeof v === "string"`), which can never surface an OPTIONAL field a row
 * doesn't carry yet — every v1.6.0 addition (hero banner image, contact CTA,
 * services intro/columns …) would have been invisible on existing rows. This
 * registry is the source of truth instead; discovery survives only as the
 * defensive fallback for a module type missing from it (`discoverScalarSpecs`).
 *
 * Every key here matches its Zod schema in `@hio/content-model` exactly —
 * guarded by `moduleFields.test.ts`.
 */
export type ScalarFieldKind = "text" | "textarea" | "url" | "select" | "toggle";

export interface ScalarFieldSpec {
  key: string;
  label: string;
  kind: ScalarFieldKind;
  maxLength?: number;
  required?: boolean;
  /** For kind "select": the curated choices. Form values are strings;
   *  `valueType: "number"` coerces back on save (e.g. the `columns` unions). */
  options?: ReadonlyArray<{ name: string; value: string }>;
  valueType?: "number";
}

const columnsOptions = (values: number[]) =>
  values.map((v) => ({ name: `${v} column${v === 1 ? "" : "s"}`, value: String(v) }));

export const MODULE_SCALAR_FIELDS: Partial<Record<ModuleType, ScalarFieldSpec[]>> = {
  hero: [
    { key: "eyebrow", label: "Eyebrow", kind: "text", maxLength: 40 },
    { key: "headline", label: "Headline", kind: "text", maxLength: 80, required: true },
    { key: "subheadline", label: "Subheadline", kind: "text", maxLength: 160 },
    { key: "supporting_text", label: "Supporting text", kind: "textarea", maxLength: 400 },
    { key: "cta_label", label: "Button label", kind: "text", maxLength: 30 },
    { key: "cta_url", label: "Button URL", kind: "url" },
    { key: "image_url", label: "Banner image URL", kind: "url" },
    { key: "image_alt", label: "Banner image alt text", kind: "text", maxLength: 160 },
  ],
  bio: [
    { key: "tagline", label: "Tagline", kind: "text", maxLength: 80 },
    { key: "title", label: "Title", kind: "text", maxLength: 60, required: true },
    { key: "body", label: "Body", kind: "textarea", maxLength: 800, required: true },
    { key: "photo_url", label: "Photo URL", kind: "url" },
    { key: "photo_alt", label: "Photo alt text", kind: "text" },
  ],
  links: [
    { key: "title", label: "Title", kind: "text", required: true },
    { key: "intro", label: "Intro", kind: "textarea", maxLength: 240 },
    {
      key: "columns",
      label: "Columns",
      kind: "select",
      required: true,
      options: columnsOptions([2, 3, 4]),
      valueType: "number",
    },
  ],
  calendar: [
    { key: "title", label: "Title", kind: "text", required: true },
    { key: "intro", label: "Intro", kind: "textarea", maxLength: 240 },
    { key: "show_past", label: "Show past events", kind: "toggle" },
  ],
  contact: [
    { key: "title", label: "Title", kind: "text", maxLength: 60, required: true },
    { key: "intro", label: "Intro", kind: "textarea", maxLength: 300 },
    { key: "email", label: "Email", kind: "text" },
    { key: "phone", label: "Phone", kind: "text", maxLength: 40 },
    { key: "location", label: "Location", kind: "text", maxLength: 120 },
    { key: "hours", label: "Hours", kind: "text", maxLength: 160 },
    { key: "cta_label", label: "Button label", kind: "text", maxLength: 30 },
    { key: "cta_url", label: "Button URL", kind: "url" },
  ],
  services: [
    { key: "title", label: "Title", kind: "text", required: true },
    { key: "intro", label: "Intro", kind: "textarea", maxLength: 300 },
    {
      key: "columns",
      label: "Columns",
      kind: "select",
      options: columnsOptions([1, 2, 3]),
      valueType: "number",
    },
  ],
  gallery: [
    { key: "title", label: "Title", kind: "text", required: true },
    { key: "intro", label: "Intro", kind: "textarea", maxLength: 240 },
    {
      key: "columns",
      label: "Columns",
      kind: "select",
      required: true,
      options: columnsOptions([2, 3, 4]),
      valueType: "number",
    },
  ],
  testimonial: [
    { key: "title", label: "Title", kind: "text", required: true },
    { key: "intro", label: "Intro", kind: "textarea", maxLength: 240 },
  ],
  custom: [
    { key: "title", label: "Title", kind: "text", maxLength: 80, required: true },
    { key: "body", label: "Body (markdown)", kind: "textarea", maxLength: 5000, required: true },
  ],
};

/** Fallback for a module type absent from the registry: derive specs from the
 *  content object's own keys — the editors' historical discovery behaviour. */
export function discoverScalarSpecs(content: Record<string, unknown>): ScalarFieldSpec[] {
  const specs: ScalarFieldSpec[] = [];
  for (const [key, value] of Object.entries(content)) {
    if (typeof value === "string") {
      specs.push({ key, label: key, kind: key === "body" ? "textarea" : "text" });
    } else if (typeof value === "boolean") {
      specs.push({ key, label: key, kind: "toggle" });
    } else if (key === "columns" && typeof value === "number") {
      specs.push({
        key,
        label: key,
        kind: "select",
        required: true,
        options: columnsOptions([2, 3, 4]),
        valueType: "number",
      });
    }
  }
  return specs;
}

/** The form-state value for one scalar field: strings for every text-ish kind
 *  and selects (numbers stringified), booleans for toggles. */
export type ScalarFormValue = string | boolean;

/** Initial form state for `specs` over the section's current content. */
export function initialScalarValues(
  specs: ScalarFieldSpec[],
  content: Record<string, unknown>,
): Record<string, ScalarFormValue> {
  const out: Record<string, ScalarFormValue> = {};
  for (const s of specs) {
    const v = content[s.key];
    if (s.kind === "toggle") {
      out[s.key] = typeof v === "boolean" ? v : false;
    } else if (s.kind === "select") {
      out[s.key] =
        v == null
          ? s.required
            ? (s.options?.[0]?.value ?? "")
            : ""
          : String(v as string | number);
    } else {
      out[s.key] = typeof v === "string" ? v : "";
    }
  }
  return out;
}

/**
 * Merge edited scalar values back over the section's content, Zod-compatibly:
 * blank optional fields are REMOVED, not written as "" (z.string().url()
 * .optional() rejects an empty string — optional only permits undefined), and
 * select values marked `valueType: "number"` are coerced back to numbers.
 */
export function applyScalarValues(
  specs: ScalarFieldSpec[],
  content: Record<string, unknown>,
  values: Record<string, ScalarFormValue>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...content };
  for (const s of specs) {
    const v = values[s.key];
    if (s.kind === "toggle") {
      next[s.key] = v === true;
    } else if (v === "" || v == null) {
      if (s.required) next[s.key] = "";
      else delete next[s.key];
    } else if (s.valueType === "number") {
      next[s.key] = Number(v);
    } else {
      next[s.key] = v;
    }
  }
  return next;
}
