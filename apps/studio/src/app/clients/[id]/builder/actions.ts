"use server";

import { createClient } from "@/lib/supabase/server";
import { type ModuleType, resolveVariant } from "@hio/content-model";
import type { Json } from "@hio/db";
import { revalidatePath } from "next/cache";
import { computeSwap } from "./reorder";

export type ActionResult = { ok: true } | { error: string };

/**
 * Resolves the caller's session and the target studio client, enforcing both the
 * agency-staff gate (is_admin) and tenant membership. The membership check rides on
 * RLS: `tenants_select_member` only returns the row if the caller belongs to it, so
 * a non-member gets `null`. Section writes are independently gated by the
 * `sections_write_studio_member` policy — this is the friendly-error layer.
 */
type ClientCtx = Awaited<ReturnType<typeof createClient>>;
type RequireClientResult =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: ClientCtx;
      tenant: { id: string; schema_variant: string };
      site: { id: string };
    };

async function requireClient(tenantId: string): Promise<RequireClientResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: settings } = await supabase
    .from("user_settings")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (settings?.is_admin !== true) return { ok: false, error: "Not authorized: agency staff only" };

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, schema_variant")
    .eq("id", tenantId)
    .eq("kind", "studio_client")
    .maybeSingle();
  if (!tenant) return { ok: false, error: "Client not found" };

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!site) return { ok: false, error: "Client has no site" };

  return { ok: true, supabase, tenant, site };
}

export async function addSection(tenantId: string, type: ModuleType): Promise<ActionResult> {
  const ctx = await requireClient(tenantId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, tenant, site } = ctx;

  // The client's own provider is the authority on which modules it may use.
  let def: ReturnType<ReturnType<typeof resolveVariant>["getModule"]>;
  try {
    def = resolveVariant(tenant.id, tenant.schema_variant).getModule(type);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not resolve client schema" };
  }
  if (!def) return { error: `Module "${type}" is not enabled for this client` };

  const { count } = await supabase
    .from("sections")
    .select("*", { count: "exact", head: true })
    .eq("site_id", site.id);

  // sections_write_studio_member RLS enforces tenant membership on insert.
  const { error } = await supabase.from("sections").insert({
    tenant_id: tenant.id,
    site_id: site.id,
    type,
    content: def.defaults as Json,
    width: def.width[1],
    order: count ?? 0,
  });
  if (error) return { error: error.message };
  revalidatePath(`/clients/${tenantId}/builder`);
  return { ok: true };
}

export async function updateSectionContent(
  tenantId: string,
  sectionId: string,
  content: Json,
): Promise<ActionResult> {
  const ctx = await requireClient(tenantId);
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("sections")
    .update({ content })
    .eq("id", sectionId)
    .eq("site_id", ctx.site.id);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${tenantId}/builder`);
  return { ok: true };
}

export async function deleteSection(tenantId: string, sectionId: string): Promise<ActionResult> {
  const ctx = await requireClient(tenantId);
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("sections")
    .delete()
    .eq("id", sectionId)
    .eq("site_id", ctx.site.id);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${tenantId}/builder`);
  return { ok: true };
}

export async function moveSection(
  tenantId: string,
  sectionId: string,
  dir: "up" | "down",
): Promise<ActionResult> {
  const ctx = await requireClient(tenantId);
  if (!ctx.ok) return { error: ctx.error };
  const { supabase, site } = ctx;

  const { data: secs } = await supabase
    .from("sections")
    .select("id, order")
    .eq("site_id", site.id)
    .order("order");
  if (!secs) return { error: "No sections" };

  const swap = computeSwap(secs, sectionId, dir);
  if (!swap) return { ok: true }; // at an edge — nothing to do

  // Swap the two adjacent rows' order values. Two membership-gated (RLS) updates;
  // there is no unique constraint on (site_id, order), so the interim state is safe.
  const r1 = await supabase.from("sections").update({ order: swap.aOrder }).eq("id", swap.aId);
  if (r1.error) return { error: r1.error.message };
  const r2 = await supabase.from("sections").update({ order: swap.bOrder }).eq("id", swap.bId);
  if (r2.error) return { error: r2.error.message };

  revalidatePath(`/clients/${tenantId}/builder`);
  return { ok: true };
}
