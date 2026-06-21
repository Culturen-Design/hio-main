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
