"use server";

import { createClient } from "@/lib/supabase/server";
import { type ModuleType, selfServeSchema } from "@hio/content-model";
import type { Json } from "@hio/db";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { error: string };

async function requirePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();
  if (!page) throw new Error("No page for user");
  return { supabase, page };
}

export async function addModule(type: ModuleType): Promise<ActionResult> {
  const { supabase, page } = await requirePage();
  const def = selfServeSchema.getModule(type);
  if (!def) return { error: `Unknown module: ${type}` };

  const { count } = await supabase
    .from("sections")
    .select("*", { count: "exact", head: true })
    .eq("page_id", page.id);

  // RLS enforces tier access (allowed_module_types) on insert — defense in depth.
  const { error } = await supabase.from("sections").insert({
    page_id: page.id,
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
  const { supabase } = await requirePage();
  const { error } = await supabase.from("sections").update({ content }).eq("id", sectionId);
  if (error) return { error: error.message };
  revalidatePath("/builder");
  return { ok: true };
}

export async function deleteSection(sectionId: string): Promise<ActionResult> {
  const { supabase } = await requirePage();
  const { error } = await supabase.from("sections").delete().eq("id", sectionId);
  if (error) return { error: error.message };
  revalidatePath("/builder");
  return { ok: true };
}

export async function moveSection(sectionId: string, dir: "up" | "down"): Promise<ActionResult> {
  const { supabase, page } = await requirePage();
  const { data: secs } = await supabase
    .from("sections")
    .select("id")
    .eq("page_id", page.id)
    .order("order");
  if (!secs) return { error: "No sections" };

  const ids = secs.map((s) => s.id);
  const i = ids.indexOf(sectionId);
  const j = dir === "up" ? i - 1 : i + 1;
  const a = ids[i];
  const b = ids[j];
  if (!a || !b) return { ok: true }; // at an edge — nothing to do

  ids[i] = b;
  ids[j] = a;
  const updates = ids.map((id, order) => ({ id, order }));

  // reorder_sections is SECURITY DEFINER with a page-ownership guard (migration 005).
  const { error } = await supabase.rpc("reorder_sections", {
    p_page_id: page.id,
    p_updates: updates as unknown as Json,
  });
  if (error) return { error: error.message };
  revalidatePath("/builder");
  return { ok: true };
}
