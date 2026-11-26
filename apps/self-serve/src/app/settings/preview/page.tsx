import {
  ACCENT_SWATCHES,
  DEFAULT_THEME,
  FONT_STACKS,
  MARGIN_PATTERN_OPTIONS,
  PREVIEW_SECTIONS,
  RADIUS_PRESETS,
  STYLE_OPTIONS,
  SiteSections,
  themeToStyle,
} from "@hio/ui";

/**
 * A live preview of the site-look picker's effect, embedded via `<iframe>` in
 * `SettingsForm`/Studio's `ThemeForm` so a style/margin-pattern choice previews
 * immediately without leaving the page or opening the real public site. This
 * route intentionally carries no real user data — just the theme values from
 * the query string, rendered against fixed sample content — so it needs no
 * auth. An iframe gives it its own viewport, which matters: the Warm Blueprint
 * scaffold's spacing uses `vw`-relative `clamp()`s, so rendering it at a small
 * scale inside the settings page's own layout (rather than in its own frame)
 * would throw off the margin/scaffold proportions relative to what a visitor
 * actually sees.
 *
 * Only curated values are ever rendered — anything else falls back to the
 * default, exactly like `parseSiteTheme` does for a stored theme.
 */
export default async function ThemePreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const accent =
    ACCENT_SWATCHES.find((s) => s.value === one(params.accent))?.value ?? DEFAULT_THEME.accent;
  const font = FONT_STACKS.find((f) => f.value === one(params.font))?.value ?? DEFAULT_THEME.font;
  const radius =
    RADIUS_PRESETS.find((r) => r.value === one(params.radius))?.value ?? DEFAULT_THEME.radius;
  const style =
    STYLE_OPTIONS.find((s) => s.value === one(params.style))?.value ?? DEFAULT_THEME.style;
  const marginPattern =
    MARGIN_PATTERN_OPTIONS.find((p) => p.value === one(params.marginPattern))?.value ??
    DEFAULT_THEME.marginPattern;

  const theme = { accent, font, radius, style, marginPattern };

  return (
    <main
      className={`site-public site-style-${style} site-margin-${marginPattern}`}
      style={{ minHeight: "100vh", ...themeToStyle(theme) }}
    >
      <SiteSections sections={PREVIEW_SECTIONS} />
    </main>
  );
}
