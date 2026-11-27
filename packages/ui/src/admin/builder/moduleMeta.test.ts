import { MODULE_TYPES } from "@hio/content-model";
import { describe, expect, it } from "vitest";
import { insertIndex, moduleDescription, sectionSummary } from "./moduleMeta";

describe("moduleDescription", () => {
  it("describes every module type the content model knows", () => {
    for (const t of MODULE_TYPES) expect(moduleDescription(t)).toBeTruthy();
  });
});

describe("sectionSummary", () => {
  it("joins the title and the item count", () => {
    expect(sectionSummary("services", { title: "My services", items: [{}, {}, {}] })).toBe(
      "My services · 3 services",
    );
    expect(sectionSummary("gallery", { title: "Work", images: [{}] })).toBe("Work · 1 image");
  });

  it("uses the hero headline and tolerates missing content", () => {
    expect(sectionSummary("hero", { headline: "Hello" })).toBe("Hello");
    expect(sectionSummary("links", null)).toBe("0 links");
    expect(sectionSummary("custom", { title: "  " })).toBe("");
  });
});

describe("insertIndex", () => {
  it("appends when dropped at the end or nowhere", () => {
    expect(insertIndex(null, 3)).toBeUndefined();
    expect(insertIndex(3, 3)).toBeUndefined();
  });

  it("inserts before the card it was dropped on", () => {
    expect(insertIndex(0, 3)).toBe(0);
    expect(insertIndex(2, 3)).toBe(2);
  });
});
