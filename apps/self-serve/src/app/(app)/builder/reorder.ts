/** A section's identity + sort position, as loaded for reordering. */
export type OrderedSection = { id: string; order: number };

/** The two row updates that swap a section with its neighbour. */
export type Swap = { aId: string; aOrder: number; bId: string; bOrder: number };

/**
 * Computes the order-value swap to move `sectionId` one step in `dir` within an
 * order-sorted list. Returns `null` at an edge (or when the id is absent) — nothing
 * to do. Pure so the move logic is unit-tested without a database.
 */
export function computeSwap(
  secs: OrderedSection[],
  sectionId: string,
  dir: "up" | "down",
): Swap | null {
  const i = secs.findIndex((s) => s.id === sectionId);
  if (i === -1) return null;
  const j = dir === "up" ? i - 1 : i + 1;
  const a = secs[i];
  const b = secs[j];
  if (!a || !b) return null;
  // a takes b's order and vice-versa.
  return { aId: a.id, aOrder: b.order, bId: b.id, bOrder: a.order };
}

/**
 * Computes the sequence of order-value swaps that moves `sectionId` from its
 * current position to `toIndex` within an order-sorted list, for drag-and-drop
 * reorder to an arbitrary position (not just an adjacent step). Built by walking
 * `computeSwap` one step at a time toward `toIndex`, so it reuses the exact same
 * adjacent-swap semantics the up/down buttons used — a drag is just several swaps
 * applied in sequence. Returns `[]` if the id is unknown or `toIndex` is out of range.
 */
export function computeReorder(secs: OrderedSection[], sectionId: string, toIndex: number): Swap[] {
  if (toIndex < 0 || toIndex >= secs.length) return [];
  let current = secs;
  let i = current.findIndex((s) => s.id === sectionId);
  if (i === -1) return [];

  const dir: "up" | "down" = toIndex < i ? "up" : "down";
  const swaps: Swap[] = [];
  while (i !== toIndex) {
    const swap = computeSwap(current, sectionId, dir);
    if (!swap) break;
    swaps.push(swap);
    current = current.map((s) => {
      if (s.id === swap.aId) return { ...s, order: swap.aOrder };
      if (s.id === swap.bId) return { ...s, order: swap.bOrder };
      return s;
    });
    current = [...current].sort((a, b) => a.order - b.order);
    i = current.findIndex((s) => s.id === sectionId);
  }
  return swaps;
}
