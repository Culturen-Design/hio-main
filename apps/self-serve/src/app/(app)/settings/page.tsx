import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { parseSiteTheme, resolveTheme } from "@hio/ui";
import { Container, PageHeader, SiteLookForm } from "@hio/ui/admin";
import { redirect } from "next/navigation";
import { updateTheme } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("theme, sites(slug)")
    .eq("kind", "self_serve")
    .maybeSingle();
  if (!tenant) redirect("/dashboard");

  const slug = tenant.sites?.[0]?.slug;
  const livePageHref = slug
    ? new URL(`/${slug}`, publicEnv.NEXT_PUBLIC_SITE_URL).toString()
    : undefined;

  return (
    <Container size="wide">
      <PageHeader
        title="Site look"
        description="How your public page looks. The preview shows your own page and follows every change before you save."
      />
      <SiteLookForm
        initial={resolveTheme(parseSiteTheme(tenant.theme))}
        onSave={updateTheme}
        previewSrc="/settings/preview"
        livePageHref={livePageHref}
      />
    </Container>
  );
}
