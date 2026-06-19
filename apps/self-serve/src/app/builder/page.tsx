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

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!page) redirect("/dashboard");

  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("page_id", page.id)
    .order("order");

  // Tier-aware list, intersected with the module types we actually have renderers for.
  const supported = new Set<string>(selfServeSchema.modules.map((m) => m.type));
  const { data: allowed } = await supabase.rpc("allowed_module_types");
  const allowedList = (allowed ?? []).filter((t) => supported.has(t)) as ModuleType[];

  return <BuilderCanvas page={page} sections={sections ?? []} allowed={allowedList} />;
}
