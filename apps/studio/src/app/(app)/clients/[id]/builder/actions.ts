"use server";

import { createClient } from "@/lib/supabase/server";
import { type ModuleType, resolveVariant } from "@hio/content-model";
import type { Json } from "@hio/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { computeReorder } from "./reorder";

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

/** Optional drop position from the builder's component toolbar. */
const atIndexInput = z.number().int().min(0).max(1000).optional();

/** Adds a section at the end, or before the section at `atIndex` when the
 *  module was dropped in place from the component toolbar. */
export async function addSection(
  tenantId: string,
  type: ModuleType,
  atIndex?: number,
): Promise<ActionResult> {
  const pos = atIndexInput.safeParse(atIndex);
  if (!pos.success) return { error: "Invalid position" };
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
  const { data: added, error } = await supabase
    .from("sections")
    .insert({
      tenant_id: tenant.id,
      site_id: site.id,
      type,
      content: def.defaults as Json,
      width: def.width[1],
      order: count ?? 0,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  // Dropped in place: move it from the end to its slot with the same
  // membership-gated reorder the drag handle uses.
  if (pos.data !== undefined && pos.data < (count ?? 0)) {
    return moveSection(tenantId, added.id, pos.data);
  }
  revalidatePath(`/clients/${tenantId}/builder`);
  return { ok: true };
}

/** `type` comes from the caller (already in scope from the section it's editing) rather
 *  than a fresh DB lookup — it only selects which Zod schema to validate against, never
 *  bypasses `requireClient`'s membership check, so trusting the client here is safe
 *  (worst case is validating against the wrong-but-still-real schema). */
export async function updateSectionContent(
  tenantId: string,
  sectionId: string,
  type: ModuleType,
  content: Json,
): Promise<ActionResult> {
  const ctx = await requireClient(tenantId);
  if (!ctx.ok) return { error: ctx.error };

  try {
    const def = resolveVariant(ctx.tenant.id, ctx.tenant.schema_variant).getModule(type);
    if (def) {
      const parsed = def.contentSchema.safeParse(content);
      if (!parsed.success) return { error: `Invalid content: ${parsed.error.message}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not resolve client schema" };
  }

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
  toIndex: number,
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

  // Drag-and-drop to an arbitrary index, computed as a sequence of adjacent
  // order-value swaps (same membership-gated per-row updates the old up/down
  // buttons used; no unique constraint on (site_id, order), so interim states are safe).
  const swaps = computeReorder(secs, sectionId, toIndex);
  for (const swap of swaps) {
    const r1 = await supabase.from("sections").update({ order: swap.aOrder }).eq("id", swap.aId);
    if (r1.error) return { error: r1.error.message };
    const r2 = await supabase.from("sections").update({ order: swap.bOrder }).eq("id", swap.bId);
    if (r2.error) return { error: r2.error.message };
  }

  revalidatePath(`/clients/${tenantId}/builder`);
  return { ok: true };
}
