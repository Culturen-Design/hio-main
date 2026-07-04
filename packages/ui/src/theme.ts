import type { CSSProperties } from "react";

/** The rounding presets a site can pick (M2-widening per-site theming MVP). */
export type RadiusPreset = "sharp" | "soft" | "pill";

/**
 * Per-tenant visual theme, stored as the `tenants.theme` JSONB column. It is
 * presentation-only, so it lives in `@hio/ui` (the M3 seam-freeze decision keeps
 * `@hio/content-model` presentation-free). Every field is optional — a missing
 * field falls back to the renderer defaults, so an empty `{}` theme renders fine.
 */
export interface SiteTheme {
  /** Brand/accent colour (any CSS colour). Feeds `--color-primary` so the
   *  `bg-primary`/`text-primary-foreground` utilities resolve to it per site. */
  accent?: string;
  /** Page background (any CSS colour). */
  background?: string;
  /** Base text colour (any CSS colour). */
  foreground?: string;
  /** Font-family stack applied to the whole site. */
  font?: string;
  /** Rounding preset, feeding `--radius-card` (the `rounded-card` utility). */
  radius?: RadiusPreset;
}

/** Curated accent swatches (not a free color picker) — each pairs a Tailwind-
 *  palette-derived value with a foreground that reads legibly on it. */
export const ACCENT_SWATCHES: ReadonlyArray<{ name: string; value: string; foreground: string }> = [
  { name: "Slate", value: "#0f172a", foreground: "#ffffff" },
  { name: "Blue", value: "#2563eb", foreground: "#ffffff" },
  { name: "Emerald", value: "#059669", foreground: "#ffffff" },
  { name: "Rose", value: "#e11d48", foreground: "#ffffff" },
  { name: "Amber", value: "#d97706", foreground: "#0f172a" },
  { name: "Violet", value: "#7c3aed", foreground: "#ffffff" },
];

/** Curated font stacks (not upload or a font search). */
export const FONT_STACKS: ReadonlyArray<{ name: string; value: string }> = [
  { name: "Sans (default)", value: "ui-sans-serif, system-ui, -apple-system, sans-serif" },
  { name: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { name: "Mono", value: "ui-monospace, 'SFMono-Regular', Menlo, monospace" },
  { name: "Rounded", value: "'Trebuchet MS', 'Segoe UI', sans-serif" },
];

/** The picker's fallback selection for a tenant with no theme set yet — the
 *  first entry of each curated list, named so callers don't index into the
 *  arrays themselves (arrays are indexable-undefined under strict TS). */
export const DEFAULT_THEME: Required<Pick<SiteTheme, "accent" | "font" | "radius">> = {
  accent: ACCENT_SWATCHES[0]?.value ?? "#0f172a",
  font: FONT_STACKS[0]?.value ?? "ui-sans-serif, system-ui, -apple-system, sans-serif",
  radius: "soft",
};

/** Rounding presets offered in the picker, mapped to the `--radius-card` value. */
export const RADIUS_PRESETS: ReadonlyArray<{ name: string; value: RadiusPreset }> = [
  { name: "Sharp", value: "sharp" },
  { name: "Soft (default)", value: "soft" },
  { name: "Pill", value: "pill" },
];

const RADIUS_VALUES: Record<RadiusPreset, string> = {
  sharp: "0.125rem",
  soft: "0.75rem",
  pill: "9999px",
};

/**
 * Parse an unknown JSON value (the free-form `theme` JSONB from the DB) into a
 * `SiteTheme`, keeping only the recognised fields. Defensive by design: a
 * malformed or partial theme degrades to `{}` rather than throwing.
 */
export function parseSiteTheme(value: unknown): SiteTheme {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const pick = (k: "accent" | "background" | "foreground" | "font") =>
    typeof v[k] === "string" ? (v[k] as string) : undefined;
  const radius = v.radius;
  return {
    accent: pick("accent"),
    background: pick("background"),
    foreground: pick("foreground"),
    font: pick("font"),
    radius: radius === "sharp" || radius === "soft" || radius === "pill" ? radius : undefined,
  };
}

/**
 * Turn a `SiteTheme` into inline styles for the public-site wrapper: base
 * background/text/font, plus the CSS custom properties the `@theme` tokens key
 * off (`--color-primary`/`--color-primary-foreground`/`--radius-card`) so
 * `bg-primary`/`text-primary-foreground`/`rounded-card` utility classes resolve
 * differently per site without Tailwind regenerating any CSS. Only set keys
 * produce style properties, so unset fields inherit the document defaults.
 */
export function themeToStyle(theme: SiteTheme): CSSProperties {
  const style: CSSProperties & Record<string, string> = {};
  if (theme.background) style.background = theme.background;
  if (theme.foreground) style.color = theme.foreground;
  if (theme.font) style.fontFamily = theme.font;
  if (theme.accent) {
    style["--site-accent"] = theme.accent;
    style["--color-primary"] = theme.accent;
    style["--color-primary-foreground"] =
      ACCENT_SWATCHES.find((s) => s.value === theme.accent)?.foreground ?? "#ffffff";
  }
  if (theme.radius) style["--radius-card"] = RADIUS_VALUES[theme.radius];
  return style;
}
