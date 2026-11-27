import { createClient } from "@/lib/supabase/server";
import type { ModuleType } from "@hio/content-model";
import { SiteSections, type StyleVariant, parseSiteTheme, sitePageProps } from "@hio/ui";

export type PublicSection = {
  id: string;
  type: ModuleType;
  content: unknown;
  style_variant: StyleVariant | null;
  width: number;
};

export type PublicSite = {
  site_slug: string;
  title: string | null;
  tenant_name: string;
  theme: unknown;
  sections: PublicSection[];
};

/** Fetch a published site by its slug via the anon-callable get_public_site RPC.
 *  Returns null for unpublished/unknown slugs (the RPC filters by is_published). */
export async function fetchPublicSiteBySlug(slug: string): Promise<PublicSite | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_site", { p_slug: slug });
  return data ? (data as unknown as PublicSite) : null;
}

/** Fetch a published site by a mapped custom domain via get_public_site_by_domain
 *  (M4.8). The RPC lowercases the host; callers should still pass a port-stripped
 *  host. Returns null when no published site maps to the host (→ 404). */
export async function fetchPublicSiteByDomain(host: string): Promise<PublicSite | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_site_by_domain", { p_host: host });
  return data ? (data as unknown as PublicSite) : null;
}

/** The public site render — shared by the /sites/[slug] route and the custom-domain
 *  host route so both products of M4.6/M4.8 render identically. */
export function PublicSiteView({ site }: { site: PublicSite }) {
  const page = sitePageProps(parseSiteTheme(site.theme));

  return (
    <main className={page.className} style={page.style}>
      {site.sections.length === 0 ? (
        <p style={{ padding: "2rem 1.5rem", opacity: 0.6 }}>This site has no content yet.</p>
      ) : (
        <SiteSections sections={site.sections} />
      )}
    </main>
  );
}
