import { MODULE_REGISTRY, type ModuleType } from "@hio/content-model";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { COLLECTION_FIELD_REGISTRY, cleanCollectionRows } from "./collectionFields";
import {
  MODULE_SCALAR_FIELDS,
  applyScalarValues,
  discoverScalarSpecs,
  initialScalarValues,
} from "./moduleFields";

/** Pull the top-level shape out of a module's content schema (all 9 are
 *  z.object). Lets the drift guards below compare registry keys to the REAL
 *  schema keys instead of trusting a comment. */
function shapeOf(schema: unknown): Record<string, z.ZodTypeAny> {
  return (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).shape;
}

describe("MODULE_SCALAR_FIELDS ↔ content-model drift guard", () => {
  it("covers all 9 module types", () => {
    expect(Object.keys(MODULE_SCALAR_FIELDS).sort()).toEqual(Object.keys(MODULE_REGISTRY).sort());
  });

  it("every registered scalar field key exists on its module's Zod schema", () => {
    for (const [type, specs] of Object.entries(MODULE_SCALAR_FIELDS)) {
      const def = MODULE_REGISTRY[type as ModuleType];
      expect(def, `module ${type}`).toBeDefined();
      const keys = Object.keys(shapeOf(def?.contentSchema));
      for (const spec of specs ?? []) {
        expect(keys, `${type}.${spec.key}`).toContain(spec.key);
      }
    }
  });

  it("every collection field key exists on its module's item schema", () => {
    for (const [type, cfg] of Object.entries(COLLECTION_FIELD_REGISTRY)) {
      const def = MODULE_REGISTRY[type as ModuleType];
      const arrayField = shapeOf(def?.contentSchema)[cfg.arrayKey];
      expect(arrayField, `${type}.${cfg.arrayKey}`).toBeDefined();
      // The array may be optional (e.g. bio.facts) — unwrap to the element.
      const unwrapped =
        arrayField instanceof z.ZodOptional ? arrayField.unwrap() : (arrayField as z.ZodTypeAny);
      const element = (unwrapped as z.ZodArray<z.ZodTypeAny>).element;
      const itemKeys = Object.keys(shapeOf(element));
      for (const f of cfg.fields) {
        expect(itemKeys, `${type}.${cfg.arrayKey}.${f.key}`).toContain(f.key);
      }
    }
  });

  it("every module's expanded fields round-trip through the editor helpers and validate", () => {
    // For each module: start from defaults, fill EVERY scalar field with a
    // plausible value via the form-state helpers, and check the result parses.
    const sample = (kind: string, key: string): string =>
      kind === "url" ? "https://example.com/x" : key === "email" ? "hi@example.com" : "Sample";
    for (const [type, specs] of Object.entries(MODULE_SCALAR_FIELDS)) {
      const def = MODULE_REGISTRY[type as ModuleType];
      if (!def) continue;
      const content = { ...(def.defaults as Record<string, unknown>) };
      const values = initialScalarValues(specs ?? [], content);
      for (const spec of specs ?? []) {
        if (spec.kind === "toggle") values[spec.key] = true;
        else if (spec.kind === "select") values[spec.key] = spec.options?.[0]?.value ?? "";
        else values[spec.key] = sample(spec.kind, spec.key);
      }
      const next = applyScalarValues(specs ?? [], content, values);
      const parsed = def.contentSchema.safeParse(next);
      expect(parsed.success, `${type}: ${JSON.stringify(parsed)}`).toBe(true);
    }
  });
});

describe("applyScalarValues", () => {
  const specs = MODULE_SCALAR_FIELDS.hero ?? [];

  it("omits blank optional fields instead of writing empty strings", () => {
    const next = applyScalarValues(
      specs,
      { headline: "Hi", cta_url: "https://old.example.com" },
      { headline: "Hi", cta_url: "" },
    );
    expect(next).not.toHaveProperty("cta_url");
    expect(next.headline).toBe("Hi");
  });

  it("coerces number-typed selects back to numbers", () => {
    const servicesSpecs = MODULE_SCALAR_FIELDS.services ?? [];
    const next = applyScalarValues(
      servicesSpecs,
      { title: "Services", items: [] },
      { title: "Services", intro: "", columns: "2" },
    );
    expect(next.columns).toBe(2);
    expect(next).not.toHaveProperty("intro");
  });
});

describe("cleanCollectionRows", () => {
  it("strips blank optionals and coerces rating to a number", () => {
    const fields = COLLECTION_FIELD_REGISTRY.testimonial?.fields ?? [];
    const rows = cleanCollectionRows(fields, [
      { id: "t1", quote: "Great", author: "Ann", role: "", avatar_url: "", rating: "5" },
    ]);
    expect(rows[0]).toEqual({ id: "t1", quote: "Great", author: "Ann", rating: 5 });
  });

  it("keeps an existing numeric rating as-is", () => {
    const fields = COLLECTION_FIELD_REGISTRY.testimonial?.fields ?? [];
    const rows = cleanCollectionRows(fields, [
      { id: "t1", quote: "Great", author: "Ann", rating: 4 },
    ]);
    expect(rows[0]?.rating).toBe(4);
  });
});

describe("discoverScalarSpecs (fallback path)", () => {
  it("derives text/textarea/toggle/columns specs from a content object", () => {
    const specs = discoverScalarSpecs({
      title: "T",
      body: "B",
      show_past: false,
      columns: 3,
      items: [],
    });
    expect(specs.map((s) => `${s.key}:${s.kind}`)).toEqual([
      "title:text",
      "body:textarea",
      "show_past:toggle",
      "columns:select",
    ]);
  });
});
