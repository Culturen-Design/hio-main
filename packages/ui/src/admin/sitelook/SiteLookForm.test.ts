import { describe, expect, it } from "vitest";
import { DEFAULT_THEME } from "../../theme";
import { changedKeys, marginPatternBlocked } from "./SiteLookForm";

describe("changedKeys", () => {
  it("is empty for the same look and lists what differs", () => {
    expect(changedKeys(DEFAULT_THEME, { ...DEFAULT_THEME })).toEqual([]);
    expect(
      changedKeys(DEFAULT_THEME, { ...DEFAULT_THEME, pageWidth: "full", radius: "round" }),
    ).toEqual(["radius", "pageWidth"]);
  });
});

describe("marginPatternBlocked", () => {
  it("allows the pattern on a Warm Blueprint page with a margin", () => {
    expect(marginPatternBlocked(DEFAULT_THEME)).toBeNull();
  });

  it("explains why it can't be used", () => {
    expect(marginPatternBlocked({ ...DEFAULT_THEME, pageWidth: "full" })).toMatch(/no margin/);
    expect(marginPatternBlocked({ ...DEFAULT_THEME, style: "stone-slate" })).toMatch(
      /Warm Blueprint/,
    );
  });
});
