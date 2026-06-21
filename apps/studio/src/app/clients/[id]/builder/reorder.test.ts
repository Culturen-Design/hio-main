import { describe, expect, it } from "vitest";
import { type OrderedSection, computeSwap } from "./reorder";

const secs: OrderedSection[] = [
  { id: "a", order: 0 },
  { id: "b", order: 1 },
  { id: "c", order: 2 },
];

describe("computeSwap", () => {
  it("moves a middle section up (swaps order values with its predecessor)", () => {
    expect(computeSwap(secs, "b", "up")).toEqual({ aId: "b", aOrder: 0, bId: "a", bOrder: 1 });
  });

  it("moves a middle section down (swaps with its successor)", () => {
    expect(computeSwap(secs, "b", "down")).toEqual({ aId: "b", aOrder: 2, bId: "c", bOrder: 1 });
  });

  it("returns null at the top edge (cannot move up)", () => {
    expect(computeSwap(secs, "a", "up")).toBeNull();
  });

  it("returns null at the bottom edge (cannot move down)", () => {
    expect(computeSwap(secs, "c", "down")).toBeNull();
  });

  it("returns null for an unknown id", () => {
    expect(computeSwap(secs, "zzz", "up")).toBeNull();
  });

  it("uses actual order values, not indices (non-contiguous orders)", () => {
    const gapped: OrderedSection[] = [
      { id: "x", order: 5 },
      { id: "y", order: 9 },
    ];
    expect(computeSwap(gapped, "y", "up")).toEqual({ aId: "y", aOrder: 5, bId: "x", bOrder: 9 });
  });
});
