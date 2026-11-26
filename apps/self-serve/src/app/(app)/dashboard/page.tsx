import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  Badge,
  Card,
  CardTitle,
  Container,
  CopyField,
  PageHeader,
  buttonClasses,
} from "@hio/ui/admin";
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
        description="Your page at a glance. Edit it in the builder, change its look in Site look."
      />

      {site ? (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="mb-0">Your page</CardTitle>
            <Badge tone="success" title="Visitors see every change as soon as you make it">
              ● Live
            </Badge>
          </div>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Title</dt>
            <dd className="m-0 font-medium text-foreground">{site.title ?? "—"}</dd>
            <dt className="text-muted-foreground">Address</dt>
            <dd className="m-0 min-w-0">
              <CopyField
                value={new URL(`/${site.slug}`, publicEnv.NEXT_PUBLIC_SITE_URL).toString()}
              />
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
              View your page ↗
            </a>
            <Link href="/settings" className={buttonClasses("secondary")}>
              Site look
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle>We couldn't find your page</CardTitle>
          <p className="m-0 text-muted-foreground text-sm">
            Your page is normally created when you sign up. Reload this screen in a minute; if it's
            still missing, sign out and back in, or contact support so we can set it up for you.
          </p>
          <div className="mt-4">
            <Link href="/dashboard" className={buttonClasses("secondary")}>
              Reload
            </Link>
          </div>
        </Card>
      )}
    </Container>
  );
}
