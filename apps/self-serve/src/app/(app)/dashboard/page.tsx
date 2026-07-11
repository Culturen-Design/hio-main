import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, Container, PageHeader, buttonClasses } from "@hio/ui/admin";
import Link from "next/link";
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

  return (
    <Container size="narrow">
      <PageHeader
        title="Dashboard"
        description={
          <>
            Signed in as <strong className="text-foreground">{user.email}</strong>
          </>
        }
      />

      {site ? (
        <Card>
          <CardTitle>Your page</CardTitle>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Title</dt>
            <dd className="m-0 font-medium text-foreground">{site.title ?? "—"}</dd>
            <dt className="text-muted-foreground">Public URL</dt>
            <dd className="m-0">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/{site.slug}</code>
            </dd>
            <dt className="text-muted-foreground">Sections</dt>
            <dd className="m-0 font-medium text-foreground">{sectionCount}</dd>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/builder" className={buttonClasses("primary")}>
              Open builder
            </Link>
            <a
              href={`/${site.slug}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses("secondary")}
            >
              View public page ↗
            </a>
            <Link href="/settings" className={buttonClasses("secondary")}>
              Site look
            </Link>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-destructive">No page found for your account.</p>
      )}
    </Container>
  );
}
