import { createClient } from "@/lib/supabase/server";
import { parseSiteTheme, resolveTheme } from "@hio/ui";
import {
  Badge,
  Card,
  CardTitle,
  Container,
  PageHeader,
  SiteLookForm,
  buttonClasses,
} from "@hio/ui/admin";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ClientSettingsForm } from "../ClientSettingsForm";
import { CustomDomainForm } from "../CustomDomainForm";
import { PublishControls } from "../PublishControls";
import { VersionList } from "../VersionList";
import { updateTenantTheme } from "../actions";

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
    <Container>
      <PageHeader
        title={client.name}
        backLink={
          <Link href="/dashboard" className="hover:text-foreground">
            ← Back to clients
          </Link>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <code>/{client.slug}</code>
            <Badge tone={site?.is_published ? "success" : "neutral"}>
              {site?.is_published ? "published" : "draft"}
            </Badge>
            <Badge>{client.plan}</Badge>
          </span>
        }
        actions={
          <Link href={`/clients/${client.id}/builder`} className={buttonClasses("primary")}>
            Open builder →
          </Link>
        }
      />

      <div className="grid gap-4">
        <Card>
          <CardTitle>Publishing</CardTitle>
          {site ? (
            <PublishControls
              tenantId={client.id}
              siteSlug={site.slug}
              isPublished={site.is_published}
            />
          ) : (
            <p className="m-0 text-sm text-destructive">This client has no site.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Custom domain</CardTitle>
          <CustomDomainForm tenantId={client.id} customDomain={client.custom_domain} />
        </Card>

        {site && (
          <Card>
            <CardTitle>Version history</CardTitle>
            <VersionList tenantId={client.id} siteId={site.id} versions={versions ?? []} />
          </Card>
        )}

        <Card>
          <CardTitle>Site look</CardTitle>
          <SiteLookForm
            initial={resolveTheme(theme)}
            onSave={updateTenantTheme.bind(null, client.id)}
            previewSrc={`/clients/preview?client=${client.id}`}
            livePageHref={site?.is_published ? `/sites/${site.slug}` : undefined}
            savedMessage="Site look saved"
          />
        </Card>

        <Card>
          <CardTitle>Settings</CardTitle>
          <ClientSettingsForm
            id={client.id}
            name={client.name}
            schemaVariant={client.schema_variant}
          />
        </Card>
      </div>
    </Container>
  );
}
