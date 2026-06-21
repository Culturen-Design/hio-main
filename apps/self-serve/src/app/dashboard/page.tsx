import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The caller's self_serve tenant + site (RLS-scoped to their membership). Proves the
  // full chain: auth → RLS → the handle_new_user trigger that provisions the tenant +
  // site + hero section on signup.
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, sites(id, slug, title)")
    .eq("kind", "self_serve")
    .maybeSingle();
  const site = tenant?.sites?.[0] ?? null;

  let sectionCount = 0;
  if (site) {
    const { count } = await supabase
      .from("sections")
      .select("*", { count: "exact", head: true })
      .eq("site_id", site.id);
    sectionCount = count ?? 0;
  }

  const { data: settings } = await supabase
    .from("user_settings")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main
      style={{ fontFamily: "system-ui", maxWidth: 640, margin: "0 auto", padding: "3rem 1.5rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <form action={signOut}>
          <button
            type="submit"
            style={{
              padding: "0.5rem 0.9rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "white",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </form>
      </div>

      <p style={{ color: "#6b7280" }}>
        Signed in as <strong>{user.email}</strong>
        {settings?.is_admin && (
          <>
            {" · "}
            <a href="/admin" style={{ color: "#7c3aed", fontWeight: 600 }}>
              Admin console
            </a>
          </>
        )}
      </p>

      {site ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "1.5rem",
            marginTop: "1rem",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Your page</h2>
          <p style={{ margin: "0.25rem 0" }}>
            Title: <strong>{site.title ?? "—"}</strong>
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            Public URL: <code>/{site.slug}</code>
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            Sections: <strong>{sectionCount}</strong>
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <a
              href="/builder"
              style={{
                padding: "0.5rem 0.9rem",
                borderRadius: 8,
                background: "#111827",
                color: "white",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Open builder
            </a>
            <a
              href={`/${site.slug}`}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "0.5rem 0.9rem",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                color: "#111827",
                textDecoration: "none",
              }}
            >
              View public page ↗
            </a>
          </div>
        </div>
      ) : (
        <p style={{ color: "#dc2626" }}>No page found for your account.</p>
      )}
    </main>
  );
}
