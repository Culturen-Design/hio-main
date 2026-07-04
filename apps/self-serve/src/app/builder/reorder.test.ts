import { describe, expect, it } from "vitest";
import { type OrderedSection, computeReorder, computeSwap } from "./reorder";

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

describe("computeReorder — drag-and-drop to an arbitrary index", () => {
  it("returns [] when dropped on its own current position", () => {
    expect(computeReorder(secs, "b", 1)).toEqual([]);
  });

  it("moves the first item to the end via a sequence of down-swaps", () => {
    const swaps = computeReorder(secs, "a", 2);
    expect(swaps).toEqual([
      { aId: "a", aOrder: 1, bId: "b", bOrder: 0 },
      { aId: "a", aOrder: 2, bId: "c", bOrder: 1 },
    ]);
  });

  it("moves the last item to the front via a sequence of up-swaps", () => {
    const swaps = computeReorder(secs, "c", 0);
    expect(swaps).toEqual([
      { aId: "c", aOrder: 1, bId: "b", bOrder: 2 },
      { aId: "c", aOrder: 0, bId: "a", bOrder: 1 },
    ]);
  });

  it("moves a middle item by exactly one step, matching computeSwap", () => {
    expect(computeReorder(secs, "b", 0)).toEqual([computeSwap(secs, "b", "up")]);
  });

  it("returns [] for an unknown id", () => {
    expect(computeReorder(secs, "zzz", 0)).toEqual([]);
  });

  it("returns [] for an out-of-range target index", () => {
    expect(computeReorder(secs, "a", 5)).toEqual([]);
    expect(computeReorder(secs, "a", -1)).toEqual([]);
  });
});
