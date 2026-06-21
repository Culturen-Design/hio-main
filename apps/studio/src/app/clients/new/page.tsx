import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewClientForm } from "../NewClientForm";

export default async function NewClientPage() {
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

  return (
    <main
      style={{ fontFamily: "system-ui", maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}
    >
      <a href="/dashboard" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
        ← Back to clients
      </a>
      <h1 style={{ margin: "0.5rem 0 0.25rem" }}>New client</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Creates a tenant, a site, and a starter section — ready to edit.
      </p>
      <NewClientForm />
    </main>
  );
}
