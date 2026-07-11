import { createClient } from "@/lib/supabase/server";
import { resolveVariant } from "@hio/content-model";
import type { BuilderSection } from "@hio/ui/admin";
import { notFound, redirect } from "next/navigation";
import { BuilderClient } from "./BuilderClient";

export default async function ClientBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  if (settings?.is_admin !== true) redirect("/dashboard");

  // RLS scopes this to clients the caller manages.
  const { data: client } = await supabase
    .from("tenants")
    .select("id, name, slug, schema_variant")
    .eq("id", id)
    .eq("kind", "studio_client")
    .maybeSingle();
  if (!client) notFound();

  const { data: site } = await supabase
    .from("sites")
    .select("id, slug, is_published")
    .eq("tenant_id", client.id)
    .maybeSingle();
  if (!site) notFound();

  const { data: sections } = await supabase
    .from("sections")
    .select("id, type, content, style_variant, width, order")
    .eq("site_id", site.id)
    .order("order");

  // The client's per-client provider decides which modules are addable. Resolution
  // can throw on an unknown variant — surface that rather than 500.
  let palette: { type: string; label: string }[];
  try {
    palette = resolveVariant(client.id, client.schema_variant).modules.map((m) => ({
      type: m.type,
      label: m.label,
    }));
  } catch {
    palette = [];
  }

  return (
    <BuilderClient
      tenantId={client.id}
      siteId={site.id}
      clientName={client.name}
      schemaVariant={client.schema_variant}
      sections={(sections ?? []) as BuilderSection[]}
      palette={palette}
      paletteError={palette.length === 0 ? client.schema_variant : null}
    />
  );
}
