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
 * `ThemeForm` — mirrors Self-Serve's `settings/preview` route exactly (same
 * reasoning: an iframe gives the preview its own viewport, which the Warm
 * Blueprint scaffold's `vw`-relative spacing needs to look right at any
 * embedded size). Carries no per-client data — just the theme values from the
 * query string against fixed sample content — so it needs no auth.
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
