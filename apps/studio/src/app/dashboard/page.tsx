import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Agency-staff gate: Studio access = the existing is_admin flag (M2.5b). A
  // non-staff user who authenticates is still kept out of the client workspace.
  const { data: settings } = await supabase
    .from("user_settings")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  const isStaff = settings?.is_admin === true;

  // Studio clients this staff member manages. RLS (`tenants_select_member`) already
  // scopes the result to tenants the caller belongs to; the kind filter keeps it to
  // managed clients (a staff user's own self_serve space, if any, is excluded).
  const { data: clients } = isStaff
    ? await supabase
        .from("tenants")
        .select("id, name, slug, schema_variant, plan, created_at")
        .eq("kind", "studio_client")
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <main
      style={{ fontFamily: "system-ui", maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Studio</h1>
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
      </p>

      {!isStaff ? (
        <div
          style={{
            border: "1px solid #fecaca",
            background: "#fef2f2",
            borderRadius: 16,
            padding: "1.5rem",
            marginTop: "1rem",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>No Studio access</h2>
          <p style={{ margin: 0, color: "#991b1b" }}>
            This account isn’t an agency staff member. Ask an admin to grant access.
          </p>
        </div>
      ) : (
        <section style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Clients</h2>
            {/* "New client" lands in M4.3b (create_studio_client RPC). */}
            <span style={{ fontSize: 13, color: "#9ca3af" }}>{clients?.length ?? 0} total</span>
          </div>

          {clients && clients.length > 0 ? (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "1rem 0 0",
                display: "grid",
                gap: "0.75rem",
              }}
            >
              {clients.map((c) => (
                <li
                  key={c.id}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem 1.25rem" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                    <strong>{c.name}</strong>
                    <code style={{ color: "#6b7280" }}>/{c.slug}</code>
                  </div>
                  <p style={{ margin: "0.4rem 0 0", fontSize: 13, color: "#6b7280" }}>
                    Schema: <code>{c.schema_variant}</code> · Plan: {c.plan}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div
              style={{
                border: "1px dashed #d1d5db",
                borderRadius: 16,
                padding: "2rem",
                marginTop: "1rem",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              <p style={{ margin: 0 }}>No clients yet.</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: 13 }}>
                Creating clients arrives next (M4.3b).
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
