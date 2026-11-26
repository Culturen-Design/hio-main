import { describe, expect, it } from "vitest";
import { packSpans } from "./SiteSections";

describe("packSpans", () => {
  it("keeps full-width sections as they are", () => {
    expect(packSpans([12, 12, 12])).toEqual([12, 12, 12]);
  });

  it("puts two halves side by side", () => {
    expect(packSpans([6, 6, 12])).toEqual([6, 6, 12]);
  });

  it("stretches the last cell of a row the next section doesn't fit", () => {
    // 6 then 12: the half can't share a row with a full section, so it fills its row.
    expect(packSpans([6, 12])).toEqual([12, 12]);
    // 4 + 4, then an 8: the second 4 stretches to close the first row.
    expect(packSpans([4, 4, 8, 4])).toEqual([4, 8, 8, 4]);
  });

  it("closes the final row", () => {
    expect(packSpans([12, 4, 4])).toEqual([12, 4, 8]);
    expect(packSpans([6])).toEqual([12]);
  });

  it("treats missing or invalid widths as full and clamps to 3..12", () => {
    expect(packSpans([null, undefined, Number.NaN])).toEqual([12, 12, 12]);
    expect(packSpans([1, 9])).toEqual([3, 9]);
    expect(packSpans([20])).toEqual([12]);
  });

  it("every row sums to 12", () => {
    const spans = packSpans([4, 8, 6, 3, 3, 5, 7, 12, 4]);
    let acc = 0;
    for (const s of spans) {
      acc += s;
      expect(acc).toBeLessThanOrEqual(12);
      if (acc === 12) acc = 0;
    }
    expect(acc).toBe(0);
  });
});
