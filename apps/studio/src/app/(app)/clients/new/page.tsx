import { createClient } from "@/lib/supabase/server";
import { Card, Container, PageHeader } from "@hio/ui/admin";
import Link from "next/link";
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
    <Container size="narrow">
      <PageHeader
        title="New client"
        backLink={
          <Link href="/dashboard" className="hover:text-foreground">
            ← Back to clients
          </Link>
        }
        description="Creates a tenant, a site, and a starter section — ready to edit."
      />
      <Card>
        <NewClientForm />
      </Card>
    </Container>
  );
}
