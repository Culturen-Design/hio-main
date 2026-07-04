import { createClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, parseSiteTheme } from "@hio/ui";
import { notFound, redirect } from "next/navigation";
import { ClientSettingsForm } from "../ClientSettingsForm";
import { CustomDomainForm } from "../CustomDomainForm";
import { PublishControls } from "../PublishControls";
import { ThemeForm } from "../ThemeForm";
import { VersionList } from "../VersionList";

export default async function ClientSettingsPage({
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

  // RLS (tenants_select_member) scopes this to clients the caller manages.
  const { data: client } = await supabase
    .from("tenants")
    .select("id, name, slug, schema_variant, plan, kind, custom_domain, theme")
    .eq("id", id)
    .eq("kind", "studio_client")
    .maybeSingle();
  if (!client) notFound();

  const theme = parseSiteTheme(client.theme);

  const { data: site } = await supabase
    .from("sites")
    .select("id, slug, is_published")
    .eq("tenant_id", client.id)
    .maybeSingle();

  // Membership-scoped (site_versions_select_member), newest first.
  const { data: versions } = site
    ? await supabase
        .from("site_versions")
        .select("id, label, created_at")
        .eq("site_id", site.id)
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <main
      style={{ fontFamily: "system-ui", maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}
    >
      <a href="/dashboard" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
        ← Back to clients
      </a>
      <h1 style={{ margin: "0.5rem 0 0.25rem" }}>{client.name}</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        <code>/{client.slug}</code> · {site?.is_published ? "published" : "draft"} · plan{" "}
        {client.plan}
      </p>

      <a
        href={`/clients/${client.id}/builder`}
        style={{
          display: "inline-block",
          marginTop: "0.5rem",
          padding: "0.5rem 0.9rem",
          borderRadius: 8,
          background: "#111827",
          color: "white",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        Open builder →
      </a>

      <h2 style={{ fontSize: "1.05rem", marginTop: "1.5rem" }}>Publishing</h2>
      {site ? (
        <PublishControls
          tenantId={client.id}
          siteSlug={site.slug}
          isPublished={site.is_published}
        />
      ) : (
        <p style={{ color: "#dc2626" }}>This client has no site.</p>
      )}

      <h2 style={{ fontSize: "1.05rem", marginTop: "1.5rem" }}>Custom domain</h2>
      <CustomDomainForm tenantId={client.id} customDomain={client.custom_domain} />

      {site && (
        <>
          <h2 style={{ fontSize: "1.05rem", marginTop: "1.5rem" }}>Version history</h2>
          <VersionList tenantId={client.id} siteId={site.id} versions={versions ?? []} />
        </>
      )}

      <h2 style={{ fontSize: "1.05rem", marginTop: "1.5rem" }}>Site look</h2>
      <ThemeForm
        id={client.id}
        accent={theme.accent ?? DEFAULT_THEME.accent}
        font={theme.font ?? DEFAULT_THEME.font}
        radius={theme.radius ?? DEFAULT_THEME.radius}
      />

      <h2 style={{ fontSize: "1.05rem", marginTop: "1.5rem" }}>Settings</h2>
      <ClientSettingsForm id={client.id} name={client.name} schemaVariant={client.schema_variant} />
    </main>
  );
}
