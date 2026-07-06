import { describe, expect, it } from "vitest";
import { assertNotSelf, moduleOverridesSchema, normalizeOverrides, tierSchema } from "./validation";

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

describe("assertNotSelf", () => {
  it("blocks an admin from locking/disabling their own account", () => {
    expect(assertNotSelf("u1", "u1", "lock")).toEqual({
      error: "You can't lock your own account.",
    });
    expect(assertNotSelf("u1", "u1", "disable")).toEqual({
      error: "You can't disable your own account.",
    });
  });

  it("allows acting on a different user", () => {
    expect(assertNotSelf("u1", "u2", "lock")).toBeNull();
  });
});
