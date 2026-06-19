import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Proves the full chain: auth → RLS → the handle_new_user trigger that provisions
  // a page + hero section on signup.
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let sectionCount = 0;
  if (page) {
    const { count } = await supabase
      .from("sections")
      .select("*", { count: "exact", head: true })
      .eq("page_id", page.id);
    sectionCount = count ?? 0;
  }

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
      </p>

      {page ? (
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
            Title: <strong>{page.title ?? "—"}</strong>
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            Public URL: <code>/{page.slug}</code>
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            Sections: <strong>{sectionCount}</strong>{" "}
            <span style={{ color: "#6b7280" }}>(auto-provisioned on signup)</span>
          </p>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 0 }}>
            The visual builder lands in M2.4.
          </p>
        </div>
      ) : (
        <p style={{ color: "#dc2626" }}>No page found for your account.</p>
      )}
    </main>
  );
}
