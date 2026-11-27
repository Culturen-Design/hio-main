import { describe, expect, it } from "vitest";
import { widthOptions } from "./SectionCard";

describe("widthOptions", () => {
  it("offers nothing without a range (control hidden)", () => {
    expect(widthOptions(undefined, 12)).toEqual([]);
  });

  it("filters the presets to the module's allowed range", () => {
    expect(widthOptions([6, 12], 12).map((o) => o.value)).toEqual([12, 8, 6]);
    expect(widthOptions([4, 12], 12).map((o) => o.value)).toEqual([12, 8, 6, 4]);
    expect(widthOptions([12, 12], 12).map((o) => o.value)).toEqual([12]);
  });

  it("keeps a custom current width selectable", () => {
    const opts = widthOptions([4, 12], 9);
    expect(opts.map((o) => o.value)).toEqual([12, 9, 8, 6, 4]);
    expect(opts.find((o) => o.value === 9)?.label).toBe("9 of 12 columns");
  });
});
