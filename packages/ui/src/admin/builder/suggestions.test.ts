import { describe, expect, it } from "vitest";
import { buildSuggestions } from "./suggestions";

const ALL = [
  "hero",
  "bio",
  "services",
  "calendar",
  "links",
  "contact",
  "gallery",
  "testimonial",
  "custom",
];

describe("buildSuggestions", () => {
  it("suggests rewriting the hero only when a hero exists", () => {
    expect(buildSuggestions([{ type: "hero" }], ALL)).toContain("Rewrite my hero headline");
    expect(buildSuggestions([{ type: "bio" }], ALL)).not.toContain("Rewrite my hero headline");
  });

  it("suggests adding a section only if allowed AND absent", () => {
    const onPage = [{ type: "hero" }, { type: "testimonial" }];
    // testimonial present → not suggested even though allowed
    expect(buildSuggestions(onPage, ALL)).not.toContain("Add a testimonials section");
    // services absent but NOT allowed (free tier) → not suggested
    const free = ["hero", "bio", "links", "contact"];
    expect(buildSuggestions([{ type: "hero" }], free)).not.toContain("Add a services section");
    // absent and allowed → suggested
    expect(buildSuggestions([{ type: "hero" }], ALL)).toContain("Add a testimonials section");
  });

  it("suggests removal only when more than one section exists", () => {
    expect(buildSuggestions([{ type: "hero" }], ALL)).not.toContain("Remove the last section");
    expect(buildSuggestions([{ type: "hero" }, { type: "bio" }], ALL)).toContain(
      "Remove the last section",
    );
  });

  it("returns at most 4, each a single action (no compound prompts)", () => {
    const suggestions = buildSuggestions([{ type: "hero" }, { type: "bio" }], ALL);
    expect(suggestions.length).toBeLessThanOrEqual(4);
    for (const s of suggestions) {
      expect(s).not.toMatch(/\band\b|,/);
    }
  });

  it("yields sane output for an empty page", () => {
    const suggestions = buildSuggestions([], ALL);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).not.toContain("Remove the last section");
    expect(suggestions).not.toContain("Rewrite my hero headline");
  });
});
