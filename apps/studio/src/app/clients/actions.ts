"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newClientSchema, updateClientSchema } from "./validation";

export type ClientActionState = { error: string } | null;

/** Confirms the caller is signed in and an agency-staff member (is_admin). The
 *  create RPC enforces this server-side too; checking here gives a clean error and
 *  guards the direct-update path. */
async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: settings } = await supabase
    .from("user_settings")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (settings?.is_admin !== true) return null;
  return { supabase, user };
}

export async function createStudioClient(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const parsed = newClientSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    schema_variant: formData.get("schema_variant"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const staff = await requireStaff();
  if (!staff) return { error: "Not authorized: agency staff only." };

  // The RPC inserts the tenant + owner membership + site + seeded section atomically,
  // and re-enforces the is_admin gate as a SECURITY DEFINER function.
  const { data, error } = await staff.supabase.rpc("create_studio_client", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_schema_variant: parsed.data.schema_variant,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect(`/clients/${data}`);
}

export async function updateStudioClient(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const parsed = updateClientSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    schema_variant: formData.get("schema_variant"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const staff = await requireStaff();
  if (!staff) return { error: "Not authorized: agency staff only." };

  // Direct update — the tenants_update_member RLS policy ensures only a member may
  // change it; scope to studio clients so this never touches a self_serve space.
  const { error } = await staff.supabase
    .from("tenants")
    .update({ name: parsed.data.name, schema_variant: parsed.data.schema_variant })
    .eq("id", parsed.data.id)
    .eq("kind", "studio_client");
  if (error) return { error: error.message };

  revalidatePath(`/clients/${parsed.data.id}`);
  revalidatePath("/dashboard");
  return null;
}
