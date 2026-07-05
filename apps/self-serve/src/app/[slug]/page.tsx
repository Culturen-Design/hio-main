import { createClient } from "@/lib/supabase/server";
import type { ModuleType } from "@hio/content-model";
import {
  DEFAULT_THEME,
  ModuleRenderer,
  type StyleVariant,
  parseSiteTheme,
  themeToStyle,
} from "@hio/ui";
import { notFound } from "next/navigation";

type PublicSection = {
  id: string;
  type: ModuleType;
  content: unknown;
  style_variant: StyleVariant | null;
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
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_public_site", { p_slug: slug });
  if (!data) notFound();
  const site = data as unknown as PublicSite;
  const theme = parseSiteTheme(site.theme);
  const styleId = theme.style ?? DEFAULT_THEME.style;

  return (
    <main className={`site-public site-style-${styleId}`} style={themeToStyle(theme)}>
      {site.sections.map((s) => (
        <ModuleRenderer
          key={s.id}
          section={{ type: s.type, content: s.content, style_variant: s.style_variant }}
        />
      ))}
    </main>
  );
}
