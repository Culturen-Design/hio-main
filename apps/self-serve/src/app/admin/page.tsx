import { createClient } from "@/lib/supabase/server";
import { MODULE_TYPES } from "@hio/content-model";
import { redirect } from "next/navigation";
import { AdminTable, type AdminUserRow } from "./AdminTable";

/**
 * Admin console — manage user tiers and module-override grants. Gated twice:
 * here (redirect non-admins) and by RLS (`settings_update_admin`) on every write.
 */
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("user_settings")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();
  if (!me?.is_admin) redirect("/dashboard");

  // Admins can read all user_settings (RLS). For the per-user slug label we call the
  // admin-gated `get_auth_users_for_admin` RPC (SECURITY DEFINER) — it returns each
  // user's self_serve site slug, so the console no longer depends on the legacy `pages`
  // table (dropped in the CONTRACT migration). Joined by user_id in JS.
  const [{ data: settings }, { data: authUsers }] = await Promise.all([
    supabase
      .from("user_settings")
      .select("user_id, tier, module_overrides, is_admin, is_locked, is_disabled"),
    supabase.rpc("get_auth_users_for_admin"),
  ]);

  const slugByUser = new Map((authUsers ?? []).map((u) => [u.id, u.slug]));
  const rows: AdminUserRow[] = (settings ?? [])
    .map((s) => ({
      userId: s.user_id,
      slug: slugByUser.get(s.user_id) ?? null,
      tier: s.tier,
      overrides: (Array.isArray(s.module_overrides) ? s.module_overrides : []) as string[],
      isAdmin: s.is_admin,
      isLocked: s.is_locked,
      isDisabled: s.is_disabled,
    }))
    .sort((a, b) => (a.slug ?? a.userId).localeCompare(b.slug ?? b.userId));

  return (
    <main
      style={{ fontFamily: "system-ui", maxWidth: 920, margin: "0 auto", padding: "2.5rem 1.5rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>Admin</h1>
        <a href="/dashboard" style={{ fontSize: 14, color: "#6b7280" }}>
          ← Dashboard
        </a>
      </div>
      <p style={{ color: "#6b7280", fontSize: 14 }}>
        {rows.length} user{rows.length === 1 ? "" : "s"}. Free tier unlocks{" "}
        <code>hero, bio, links, contact</code>; paid unlocks everything. Overrides grant extra
        modules to a free user.
      </p>

      <AdminTable rows={rows} moduleTypes={[...MODULE_TYPES]} />
    </main>
  );
}
