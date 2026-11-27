import type { CSSProperties } from "react";

/** The rounding presets a site can pick (M2-widening per-site theming MVP). */
export type RadiusPreset = "sharp" | "soft" | "pill";

/**
 * The page-level "look system" a site can pick — a distinct theme dimension from
 * accent/font/radius above. Each value is a self-contained CSS system in
 * `globals.css` scoped under `.site-style-<value>`; swapping styles is purely a
 * new CSS block + a registry entry here, never an `@hio/ui` component change
 * (module renderers carry only `data-module` hooks + always-rendered, hidden-by-
 * default annotation markup — see the module files for detail).
 */
export type SiteStyle = "warm-blueprint-brutalism" | "stone-slate";

/** Curated style options for the picker, in display order. */
export const STYLE_OPTIONS: ReadonlyArray<{ name: string; value: SiteStyle }> = [
  { name: "Warm Blueprint (default)", value: "warm-blueprint-brutalism" },
  { name: "Stone & Slate (classic)", value: "stone-slate" },
];

/**
 * Geometric fill for the page margin — the structural strip between the shared
 * content column and the outer page frame. A second curated theme dimension,
 * mirroring how `style` works: each value maps to a `site-margin-<value>` class
 * on the public-page wrapper, and each class is pure CSS in `globals.css`
 * (currently interpreted by the warm-blueprint style only; other styles simply
 * ignore it). "none" leaves the margin as clean paper.
 */
export type MarginPattern = "none" | "dot-grid" | "diagonal-hatch" | "pinstripe";

/** Curated margin-pattern options for the picker, in display order. */
export const MARGIN_PATTERN_OPTIONS: ReadonlyArray<{ name: string; value: MarginPattern }> = [
  { name: "None (default)", value: "none" },
  { name: "Dot grid", value: "dot-grid" },
  { name: "Diagonal hatch", value: "diagonal-hatch" },
  { name: "Pinstripe rules", value: "pinstripe" },
];

const MARGIN_PATTERN_VALUES: readonly string[] = MARGIN_PATTERN_OPTIONS.map((o) => o.value);

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
  /** Page-level look system (see `SiteStyle`). */
  style?: SiteStyle;
  /** Geometric fill for the page margin (see `MarginPattern`). */
  marginPattern?: MarginPattern;
}

/** Curated accent swatches (not a free color picker) — each pairs a Tailwind-
 *  palette-derived value with a foreground that reads legibly on it. */
export const ACCENT_SWATCHES: ReadonlyArray<{ name: string; value: string; foreground: string }> = [
  { name: "Slate", value: "#0f172a", foreground: "#ffffff" },
  { name: "Blue", value: "#2563eb", foreground: "#ffffff" },
  // Dark text: white on #059669 is 3.77:1, below WCAG AA for button-size text;
  // slate-900 is 4.75:1. (The value stays put so stored themes keep matching.)
  { name: "Emerald", value: "#059669", foreground: "#0f172a" },
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
export const DEFAULT_THEME: Required<
  Pick<SiteTheme, "accent" | "font" | "radius" | "style" | "marginPattern">
> = {
  accent: ACCENT_SWATCHES[0]?.value ?? "#0f172a",
  font: FONT_STACKS[0]?.value ?? "ui-sans-serif, system-ui, -apple-system, sans-serif",
  radius: "soft",
  style: "warm-blueprint-brutalism",
  marginPattern: "none",
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
  const style = v.style;
  const marginPattern = v.marginPattern;
  return {
    accent: pick("accent"),
    background: pick("background"),
    foreground: pick("foreground"),
    font: pick("font"),
    radius: radius === "sharp" || radius === "soft" || radius === "pill" ? radius : undefined,
    style: style === "warm-blueprint-brutalism" || style === "stone-slate" ? style : undefined,
    marginPattern:
      typeof marginPattern === "string" && MARGIN_PATTERN_VALUES.includes(marginPattern)
        ? (marginPattern as MarginPattern)
        : undefined,
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
