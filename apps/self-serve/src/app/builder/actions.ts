"use server";

import { createClient } from "@/lib/supabase/server";
import { type ModuleType, selfServeSchema } from "@hio/content-model";
import type { Json } from "@hio/db";
import { revalidatePath } from "next/cache";
import { computeReorder } from "./reorder";

export type ActionResult = { ok: true } | { error: string };

/** Resolve the caller's self_serve tenant + site. RLS (tenants_select_member)
 *  scopes the SELECT to tenants the user belongs to, and each self_serve user has
 *  exactly one (provisioned by handle_new_user), so this is unambiguous. Writes
 *  ride the self_serve membership policies from migration 012 (tenant_id keyed). */
async function requireSite() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, sites(id, slug)")
    .eq("kind", "self_serve")
    .maybeSingle();
  const site = tenant?.sites?.[0];
  if (!tenant || !site) throw new Error("No site for user");

  return {
    supabase,
    tenant: { id: tenant.id, slug: tenant.slug },
    site: { id: site.id, slug: site.slug },
  };
}

export async function addModule(type: ModuleType): Promise<ActionResult> {
  const { supabase, tenant, site } = await requireSite();
  const def = selfServeSchema.getModule(type);
  if (!def) return { error: `Unknown module: ${type}` };

  const { count } = await supabase
    .from("sections")
    .select("*", { count: "exact", head: true })
    .eq("site_id", site.id);

  // RLS (sections_insert_self_serve_member) enforces tenant membership + the tier
  // gate (allowed_module_types) on insert — defense in depth.
  const { error } = await supabase.from("sections").insert({
    tenant_id: tenant.id,
    site_id: site.id,
    type,
    content: def.defaults as Json,
    width: def.width[1],
    order: count ?? 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/builder");
  return { ok: true };
}

export async function updateContent(sectionId: string, content: Json): Promise<ActionResult> {
  const { supabase } = await requireSite();
  const { error } = await supabase.from("sections").update({ content }).eq("id", sectionId);
  if (error) return { error: error.message };
  revalidatePath("/builder");
  return { ok: true };
}

export async function deleteSection(sectionId: string): Promise<ActionResult> {
  const { supabase } = await requireSite();
  const { error } = await supabase.from("sections").delete().eq("id", sectionId);
  if (error) return { error: error.message };
  revalidatePath("/builder");
  return { ok: true };
}

export async function moveSection(sectionId: string, toIndex: number): Promise<ActionResult> {
  const { supabase, site } = await requireSite();
  const { data: secs } = await supabase
    .from("sections")
    .select("id, order")
    .eq("site_id", site.id)
    .order("order");
  if (!secs) return { error: "No sections" };

  // Drag-and-drop to an arbitrary index, computed as a sequence of adjacent
  // order-value swaps (same membership-gated per-row updates the old up/down
  // buttons used — no RPC, no unique (site_id, order) constraint to worry about).
  const swaps = computeReorder(secs, sectionId, toIndex);
  for (const swap of swaps) {
    const { error: e1 } = await supabase
      .from("sections")
      .update({ order: swap.aOrder })
      .eq("id", swap.aId);
    if (e1) return { error: e1.message };
    const { error: e2 } = await supabase
      .from("sections")
      .update({ order: swap.bOrder })
      .eq("id", swap.bId);
    if (e2) return { error: e2.message };
  }

  revalidatePath("/builder");
  return { ok: true };
}
