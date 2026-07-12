import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Container, PageHeader, buttonClasses } from "@hio/ui/admin";
import Link from "next/link";
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
  // sites(is_published) rides along for the published/draft badge.
  const { data: clients } = isStaff
    ? await supabase
        .from("tenants")
        .select("id, name, slug, schema_variant, plan, created_at, sites(is_published)")
        .eq("kind", "studio_client")
        .order("created_at", { ascending: false })
    : { data: null };

  if (!isStaff) {
    return (
      <Container size="narrow">
        <PageHeader title="Studio" />
        <Card className="border-destructive/30 bg-destructive/5">
          <h2 className="m-0 text-sm font-semibold text-destructive">No Studio access</h2>
          <p className="mt-1 mb-0 text-sm text-destructive/90">
            This account isn’t an agency staff member. Ask an admin to grant access.
          </p>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="narrow">
      <PageHeader
        title="Clients"
        description={`${clients?.length ?? 0} client${(clients?.length ?? 0) === 1 ? "" : "s"}`}
        actions={
          <Link href="/clients/new" className={buttonClasses("primary")}>
            + New client
          </Link>
        }
      />

      {clients && clients.length > 0 ? (
        <ul className="m-0 grid list-none gap-3 p-0">
          {clients.map((c) => {
            const published = c.sites?.[0]?.is_published === true;
            return (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} className="block">
                  <Card className="transition-colors hover:border-primary">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-semibold">
                        {c.name}
                        <Badge tone={published ? "success" : "neutral"}>
                          {published ? "published" : "draft"}
                        </Badge>
                        <Badge>{c.plan}</Badge>
                      </span>
                      <code className="text-sm text-muted-foreground">/{c.slug}</code>
                    </div>
                    <p className="mt-1.5 mb-0 text-xs text-muted-foreground">
                      Schema: <code>{c.schema_variant}</code>
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card className="border-dashed text-center text-sm text-muted-foreground">
          <p className="m-0">No clients yet.</p>
          <p className="mt-1 mb-0 text-xs">
            Use <strong>+ New client</strong> to create your first one.
          </p>
        </Card>
      )}
    </Container>
  );
}
