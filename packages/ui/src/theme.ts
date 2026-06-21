import type { CSSProperties } from "react";

/**
 * Per-tenant visual theme, stored as the `tenants.theme` JSONB column. It is
 * presentation-only, so it lives in `@hio/ui` (the M3 seam-freeze decision keeps
 * `@hio/content-model` presentation-free). Every field is optional — a missing
 * field falls back to the renderer defaults, so an empty `{}` theme renders fine.
 */
export interface SiteTheme {
  /** Brand/accent colour (any CSS colour). Exposed as the `--site-accent` var. */
  accent?: string;
  /** Page background (any CSS colour). */
  background?: string;
  /** Base text colour (any CSS colour). */
  foreground?: string;
  /** Font-family stack applied to the whole site. */
  font?: string;
}

/**
 * Parse an unknown JSON value (the free-form `theme` JSONB from the DB) into a
 * `SiteTheme`, keeping only the recognised string fields. Defensive by design: a
 * malformed or partial theme degrades to `{}` rather than throwing.
 */
export function parseSiteTheme(value: unknown): SiteTheme {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const pick = (k: keyof SiteTheme) => (typeof v[k] === "string" ? (v[k] as string) : undefined);
  return {
    accent: pick("accent"),
    background: pick("background"),
    foreground: pick("foreground"),
    font: pick("font"),
  };
}

/**
 * Turn a `SiteTheme` into inline styles for the public-site wrapper: base
 * background/text/font, plus a `--site-accent` custom property that renderers (or
 * future themed components) can opt into. Only set keys produce style properties,
 * so unset fields inherit the document defaults.
 */
export function themeToStyle(theme: SiteTheme): CSSProperties {
  const style: CSSProperties & Record<string, string> = {};
  if (theme.background) style.background = theme.background;
  if (theme.foreground) style.color = theme.foreground;
  if (theme.font) style.fontFamily = theme.font;
  if (theme.accent) style["--site-accent"] = theme.accent;
  return style;
}
