import { createClient } from "@/lib/supabase/server";
import { type ModuleType, selfServeSchema } from "@hio/content-model";
import { redirect } from "next/navigation";
import { BuilderCanvas } from "./BuilderCanvas";

export default async function BuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The caller's self_serve tenant + site (RLS-scoped to their membership).
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, theme, sites(id, slug)")
    .eq("kind", "self_serve")
    .maybeSingle();
  const site = tenant?.sites?.[0];
  if (!tenant || !site) redirect("/dashboard");

  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("site_id", site.id)
    .order("order");

  // Tier-aware list, intersected with the module types we actually have renderers for.
  const supported = new Set<string>(selfServeSchema.modules.map((m) => m.type));
  const { data: allowed } = await supabase.rpc("allowed_module_types");
  const allowedList = (allowed ?? []).filter((t) => supported.has(t)) as ModuleType[];

  return (
    <BuilderCanvas
      tenantId={tenant.id}
      site={{ id: site.id, slug: site.slug }}
      sections={sections ?? []}
      allowed={allowedList}
      theme={tenant.theme}
    />
  );
}
