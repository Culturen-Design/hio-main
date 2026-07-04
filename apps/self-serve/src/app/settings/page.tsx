import { createClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, parseSiteTheme } from "@hio/ui";
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
    <main
      style={{ fontFamily: "system-ui", maxWidth: 640, margin: "0 auto", padding: "3rem 1.5rem" }}
    >
      <a href="/dashboard" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
        ← Back to dashboard
      </a>
      <h1 style={{ margin: "0.5rem 0 1.5rem" }}>Site look</h1>

      <SettingsForm
        accent={theme.accent ?? DEFAULT_THEME.accent}
        font={theme.font ?? DEFAULT_THEME.font}
        radius={theme.radius ?? DEFAULT_THEME.radius}
      />
    </main>
  );
}
