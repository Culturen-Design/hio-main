import { createClient } from "@/lib/supabase/server";
import type { ModuleType } from "@hio/content-model";
import {
  DEFAULT_THEME,
  SiteSections,
  type StyleVariant,
  parseSiteTheme,
  themeToStyle,
} from "@hio/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type PublicSection = {
  id: string;
  type: ModuleType;
  content: unknown;
  style_variant: StyleVariant | null;
  /** Columns out of 12; get_public_site returns it (011_custom_domains.sql). */
  width: number | null;
};

type PublicSite = {
  title: string | null;
  theme: unknown;
  sections: PublicSection[];
};

// Public, read-only page. get_public_site is the same anon-callable RPC Studio's
// /sites/[slug] uses (M4.6) — it isn't Studio-specific, it just joins sites +
// tenants + sections by slug for a published site, which also surfaces the
// tenant's theme that tenants_select_member RLS would otherwise hide from anon.
// `cache` dedupes the call between generateMetadata and the page render.
const fetchSite = cache(async (slug: string): Promise<PublicSite | null> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_site", { p_slug: slug });
  return data ? (data as unknown as PublicSite) : null;
});

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await fetchSite(slug);
  if (!site) return { title: "Page not found" };
  return { title: site.title?.trim() || slug };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await fetchSite(slug);
  if (!site) notFound();
  const theme = parseSiteTheme(site.theme);
  const styleId = theme.style ?? DEFAULT_THEME.style;
  const marginPattern = theme.marginPattern ?? DEFAULT_THEME.marginPattern;
  // The hero renders the page's <h1>; without one, give screen readers a title.
  const hasHero = site.sections.some((s) => s.type === "hero");

  return (
    <main
      className={`site-public site-style-${styleId} site-margin-${marginPattern}`}
      style={themeToStyle(theme)}
    >
      {!hasHero && <h1 className="sr-only">{site.title?.trim() || slug}</h1>}
      <SiteSections sections={site.sections} />
    </main>
  );
}
