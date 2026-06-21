import { createClient } from "@/lib/supabase/server";
import type { ModuleType } from "@hio/content-model";
import { ModuleRenderer, type StyleVariant, parseSiteTheme, themeToStyle } from "@hio/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PublicSection = {
  id: string;
  type: ModuleType;
  content: unknown;
  style_variant: StyleVariant | null;
  width: number;
};
type PublicSite = {
  site_slug: string;
  title: string | null;
  tenant_name: string;
  theme: unknown;
  sections: PublicSection[];
};

/** Fetch a published site by slug via the anon-callable get_public_site RPC.
 *  Returns null for unpublished/unknown slugs (the RPC filters by is_published). */
async function fetchPublicSite(slug: string): Promise<PublicSite | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_site", { p_slug: slug });
  return data ? (data as unknown as PublicSite) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await fetchPublicSite(slug);
  if (!site) return { title: "Not found" };
  return { title: site.title ?? site.tenant_name };
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await fetchPublicSite(slug);
  if (!site) notFound();

  const theme = parseSiteTheme(site.theme);

  return (
    <main style={{ minHeight: "100vh", fontFamily: "system-ui", ...themeToStyle(theme) }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {site.sections.length === 0 ? (
          <p style={{ opacity: 0.6 }}>This site has no content yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {site.sections.map((s) => (
              <ModuleRenderer
                key={s.id}
                section={{ type: s.type, content: s.content, style_variant: s.style_variant }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
