import { describe, expect, it } from "vitest";
import { moduleOverridesSchema, normalizeOverrides, tierSchema } from "./validation";

describe("tierSchema", () => {
  it("accepts the two valid tiers", () => {
    expect(tierSchema.parse("free")).toBe("free");
    expect(tierSchema.parse("paid")).toBe("paid");
  });

  it("rejects anything else (e.g. a privilege-escalation attempt)", () => {
    expect(tierSchema.safeParse("admin").success).toBe(false);
    expect(tierSchema.safeParse("enterprise").success).toBe(false);
    expect(tierSchema.safeParse("").success).toBe(false);
  });
});

describe("moduleOverridesSchema", () => {
  it("accepts a subset of real module types", () => {
    expect(moduleOverridesSchema.parse(["gallery", "testimonial"])).toEqual([
      "gallery",
      "testimonial",
    ]);
    expect(moduleOverridesSchema.parse([])).toEqual([]);
  });

  it("rejects unknown module types", () => {
    expect(moduleOverridesSchema.safeParse(["gallery", "not-a-module"]).success).toBe(false);
  });
});

describe("normalizeOverrides", () => {
  it("collapses an empty selection to null (use tier defaults)", () => {
    expect(normalizeOverrides([])).toBeNull();
  });

  it("de-duplicates and preserves a non-empty selection", () => {
    expect(normalizeOverrides(["gallery", "gallery", "custom"])).toEqual(["gallery", "custom"]);
  });
});
