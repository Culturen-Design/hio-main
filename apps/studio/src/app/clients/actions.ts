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

/** Publish or unpublish a client's site. The sites_write_member RLS policy gates
 *  this to tenant members; the form passes the tenant id and the desired state. */
export async function setSitePublished(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const tenantId = String(formData.get("tenant_id") ?? "");
  const publish = formData.get("publish") === "true";
  if (!tenantId) return { error: "Missing client." };

  const staff = await requireStaff();
  if (!staff) return { error: "Not authorized: agency staff only." };

  // Capture a version on publish (each publish = a restorable release). Best-effort:
  // resolve the site, snapshot, then flip the flag.
  if (publish) {
    const { data: site } = await staff.supabase
      .from("sites")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (site)
      await staff.supabase.rpc("snapshot_site", { p_site_id: site.id, p_label: "Published" });
  }

  const { error } = await staff.supabase
    .from("sites")
    .update({ is_published: publish })
    .eq("tenant_id", tenantId);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${tenantId}`);
  return null;
}

/** Manually capture a version ("Save version") of a client's site. */
export async function snapshotSite(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const tenantId = String(formData.get("tenant_id") ?? "");
  const siteId = String(formData.get("site_id") ?? "");
  if (!siteId) return { error: "Missing site." };

  const staff = await requireStaff();
  if (!staff) return { error: "Not authorized: agency staff only." };

  // snapshot_site is membership-gated server-side (is_tenant_member).
  const { error } = await staff.supabase.rpc("snapshot_site", {
    p_site_id: siteId,
    p_label: "Manual save",
  });
  if (error) return { error: error.message };

  revalidatePath(`/clients/${tenantId}`);
  return null;
}

/** Restore a client's site to a saved version. restore_site_version snapshots the
 *  current state first ("Before restore"), so a restore is itself reversible. */
export async function restoreSiteVersion(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const tenantId = String(formData.get("tenant_id") ?? "");
  const versionId = String(formData.get("version_id") ?? "");
  if (!versionId) return { error: "Missing version." };

  const staff = await requireStaff();
  if (!staff) return { error: "Not authorized: agency staff only." };

  const { error } = await staff.supabase.rpc("restore_site_version", {
    p_version_id: versionId,
  });
  if (error) return { error: error.message };

  revalidatePath(`/clients/${tenantId}`);
  revalidatePath(`/clients/${tenantId}/builder`);
  return null;
}
