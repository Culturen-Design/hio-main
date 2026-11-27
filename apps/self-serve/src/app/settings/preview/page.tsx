import { createClient } from "@/lib/supabase/server";
import { type GridSection, PREVIEW_SECTIONS, SiteSections, curatedTheme } from "@hio/ui";
import { LiveSitePage } from "@hio/ui/admin";

/**
 * The page inside the Site look preview frame. It starts from the theme in
 * the query string (curated values only) and then follows the form by
 * message, so it never reloads. A signed-in user sees their own sections
 * (RLS scopes the query to their own site); anyone else, or a page with no
 * sections yet, sees fixed sample content. An iframe gives the preview its
 * own viewport, so page widths and `vw`-based spacing look as they will on
 * the real page.
 */
export default async function ThemePreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const theme = curatedTheme(first);

  let sections: GridSection[] = PREVIEW_SECTIONS;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("sites(id)")
      .eq("kind", "self_serve")
      .maybeSingle();
    const siteId = tenant?.sites?.[0]?.id;
    if (siteId) {
      const { data } = await supabase
        .from("sections")
        .select("id, type, content, style_variant, width")
        .eq("site_id", siteId)
        .order("order");
      if (data && data.length > 0) sections = data as unknown as GridSection[];
    }
  }

  return (
    <LiveSitePage initial={theme}>
      <SiteSections sections={sections} />
    </LiveSitePage>
  );
}
