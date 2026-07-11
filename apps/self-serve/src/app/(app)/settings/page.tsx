import { createClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, parseSiteTheme } from "@hio/ui";
import { Container, PageHeader } from "@hio/ui/admin";
import { redirect } from "next/navigation";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("theme")
    .eq("kind", "self_serve")
    .maybeSingle();
  if (!tenant) redirect("/dashboard");

  const theme = parseSiteTheme(tenant.theme);

  return (
    <Container>
      <PageHeader
        title="Site look"
        description="How your public page looks — every change previews live before you save."
      />

      <SettingsForm
        accent={theme.accent ?? DEFAULT_THEME.accent}
        font={theme.font ?? DEFAULT_THEME.font}
        radius={theme.radius ?? DEFAULT_THEME.radius}
        style={theme.style ?? DEFAULT_THEME.style}
        marginPattern={theme.marginPattern ?? DEFAULT_THEME.marginPattern}
      />
    </Container>
  );
}
