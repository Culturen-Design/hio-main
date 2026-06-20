"use server";

import { createClient } from "@/lib/supabase/server";
import type { ModuleType } from "@hio/content-model";
import type { Json } from "@hio/db";
import { revalidatePath } from "next/cache";
import { moduleOverridesSchema, normalizeOverrides, tierSchema } from "./validation";

export type ActionResult = { ok: true } | { error: string };

/**
 * Gate every admin action on the caller's own `is_admin` flag. This is defense
 * in depth — the `settings_update_admin` RLS policy is the real enforcement, so
 * even if this check were bypassed the DB would still reject a non-admin write.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: me } = await supabase
    .from("user_settings")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();
  if (!me?.is_admin) throw new Error("Forbidden: admin only");

  return { supabase, adminId: user.id };
}

export async function setTier(userId: string, tier: string): Promise<ActionResult> {
  const parsed = tierSchema.safeParse(tier);
  if (!parsed.success) return { error: "Invalid tier" };

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("user_settings")
    .update({ tier: parsed.data })
    .eq("user_id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function setModuleOverrides(
  userId: string,
  types: ModuleType[],
): Promise<ActionResult> {
  const parsed = moduleOverridesSchema.safeParse(types);
  if (!parsed.success) return { error: "Invalid module selection" };

  const overrides = normalizeOverrides(parsed.data);
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("user_settings")
    // null ⇒ fall back to tier defaults; an array ⇒ grant those extra modules.
    .update({ module_overrides: overrides as Json })
    .eq("user_id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
