/**
 * Generic collection-array mutation helpers, mirroring the AI engine's
 * appendItem/updateItem/removeItem op semantics (packages/ai-engine/src/index.ts
 * `executeTool`) so a manual UI path and the AI path produce identical results.
 * Pure and framework-free — no Zod, no React, no Supabase — so both apps'
 * client components and server actions can share one tested implementation.
 * Validation happens once, at the save boundary, against the whole mutated
 * content (mirroring the engine's own `validateAgainstModule` step) — these
 * helpers don't validate individual fields themselves.
 */

export type WithId = { id: string };

export type CollectionResult<T> = { ok: true; items: T[] } | { ok: false; error: string };

/** Appends `item` to `items`, assigning a fresh id via `genId` (defaults to
 *  `crypto.randomUUID`), matching the engine's `appendItem` op — a manually
 *  added item is never user-supplied an id, same as the AI path. */
export function appendCollectionItem<T extends WithId>(
  items: readonly T[],
  item: Omit<T, "id">,
  genId: () => string = () => crypto.randomUUID(),
): T[] {
  return [...items, { ...item, id: genId() } as T];
}

/** Patches the item whose `id` matches with a partial update, matching the
 *  engine's `updateItem` op (`{...row, ...updates}`). Returns `ok:false` if no
 *  item has that id, mirroring `executeTool`'s "That item was not found." */
export function updateCollectionItem<T extends WithId>(
  items: readonly T[],
  id: string,
  updates: Partial<Omit<T, "id">>,
): CollectionResult<T> {
  let hit = false;
  const next = items.map((row) => {
    if (row.id !== id) return row;
    hit = true;
    return { ...row, ...updates };
  });
  if (!hit) return { ok: false, error: "Item not found." };
  return { ok: true, items: next };
}

/** Removes the item whose `id` matches, matching the engine's `removeItem` op
 *  (filter + length check). Returns `ok:false` if nothing was removed. */
export function removeCollectionItem<T extends WithId>(
  items: readonly T[],
  id: string,
): CollectionResult<T> {
  const next = items.filter((row) => row.id !== id);
  if (next.length === items.length) return { ok: false, error: "Item not found." };
  return { ok: true, items: next };
}
