import { MODULE_TYPES, type ModuleType } from "@hio/content-model";
import { z } from "zod";

/** A user's billing tier. Mirrors the `user_tier` enum in the DB. */
export const tierSchema = z.enum(["free", "paid"]);
export type Tier = z.infer<typeof tierSchema>;

/** Module-override grants: a set of valid module types (any subset of the platform's). */
export const moduleOverridesSchema = z.array(z.enum(MODULE_TYPES)).max(MODULE_TYPES.length);

/**
 * Normalize an override selection for storage: de-duplicate, and collapse an
 * empty set to `null` so the DB falls back to tier defaults (matches the
 * `module_overrides IS NULL` branch of `allowed_module_types()`).
 */
export function normalizeOverrides(types: ModuleType[]): ModuleType[] | null {
  const unique = [...new Set(types)];
  return unique.length > 0 ? unique : null;
}
