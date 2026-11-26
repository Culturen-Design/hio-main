"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@hio/db";
import { revalidatePath } from "next/cache";
import { updateThemeSchema } from "./validation";

export type SettingsActionState = { error: string } | null;

/** Set the caller's site theme (accent/font/radius — the per-site theming MVP).
 *  Direct update rides the tenants_update_member RLS policy (migration 007),
 *  which already scopes writes to a tenant's own members for every tenant kind. */
export async function updateTheme(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = updateThemeSchema.safeParse({
    accent: formData.get("accent"),
    font: formData.get("font"),
    radius: formData.get("radius"),
    style: formData.get("style"),
    marginPattern: formData.get("marginPattern"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, theme, sites(slug)")
    .eq("kind", "self_serve")
    .maybeSingle();
  if (!tenant) return { error: "We couldn't find your page. Please reload and try again." };

  const nextTheme = { ...(tenant.theme as Record<string, unknown>), ...parsed.data } as Json;
  const { error } = await supabase.from("tenants").update({ theme: nextTheme }).eq("id", tenant.id);
  if (error) {
    console.error("[settings] theme update failed", error);
    return { error: "Couldn't save your site look. Please try again in a moment." };
  }

  revalidatePath("/settings");
  revalidatePath("/builder");
  const slug = tenant.sites?.[0]?.slug;
  if (slug) revalidatePath(`/${slug}`);
  return null;
}
