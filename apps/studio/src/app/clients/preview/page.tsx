import { createClient } from "@/lib/supabase/server";
import { type GridSection, PREVIEW_SECTIONS, SiteSections, curatedTheme } from "@hio/ui";
import { LiveSitePage } from "@hio/ui/admin";
import { z } from "zod";

/**
 * The page inside a client's Site look preview frame — the Studio twin of
 * Self-Serve's `settings/preview`. Starts from the curated theme in the query
 * string and follows the form by message. With `?client=<id>`, staff see that
 * client's own sections (RLS limits the query to tenants they're a member
 * of); otherwise, or with no sections yet, fixed sample content.
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
  const clientId = z.string().uuid().safeParse(first.client);
  if (clientId.success) {
    const supabase = await createClient();
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("tenant_id", clientId.data)
      .maybeSingle();
    if (site) {
      const { data } = await supabase
        .from("sections")
        .select("id, type, content, style_variant, width")
        .eq("site_id", site.id)
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
