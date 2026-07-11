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

/**
 * Blocks an admin action (lock/disable) from targeting the caller's own
 * account — self-locking out of the one console that could undo it has no
 * recovery path short of direct DB access. Returns an error object to return
 * straight from the action, or `null` when the action may proceed.
 */
export function assertNotSelf(
  adminId: string,
  targetUserId: string,
  action: "lock" | "disable",
): { error: string } | null {
  if (adminId === targetUserId) {
    return { error: `You can't ${action} your own account.` };
  }
  return null;
}
