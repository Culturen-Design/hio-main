import type { CSSProperties } from "react";

/** The rounding presets a site can pick. Rounding applies to the things you
 *  touch and look at — buttons and images — never to the section grid, whose
 *  cells share their lines (docs/DESIGN-RULES.md, rule 5). "pill" is the old
 *  name of "round" and is still read from stored themes. */
export type RadiusPreset = "sharp" | "soft" | "round";

/**
 * How wide the whole page is: the side margin around the sheet of sections.
 * "classic" is the fixed, centred 1024px column every site had before this
 * setting existed, so stored themes without it render unchanged. The others
 * set the margin as a share of the window; phones keep a 16px margin (none
 * for "full"), since a percentage of a phone screen is either nothing or too
 * much. Each value maps to a `site-width-<value>` class (globals.css).
 */
export type PageWidth = "classic" | "full" | "wide" | "comfortable" | "roomy" | "narrow";

/** Page-width options for the picker, in display order. `margin` is the side
 *  margin on a computer screen, for the picker's label and diagram. */
export const PAGE_WIDTH_OPTIONS: ReadonlyArray<{
  name: string;
  value: PageWidth;
  margin: number;
  hint: string;
}> = [
  { name: "Classic", value: "classic", margin: -1, hint: "A centred 1024px column" },
  { name: "Full screen", value: "full", margin: 0, hint: "Edge to edge, no margin" },
  { name: "Wide", value: "wide", margin: 5, hint: "5% margin each side" },
  { name: "Comfortable", value: "comfortable", margin: 10, hint: "10% margin each side" },
  { name: "Roomy", value: "roomy", margin: 15, hint: "15% margin each side" },
  { name: "Narrow", value: "narrow", margin: 20, hint: "20% margin each side" },
];

const PAGE_WIDTH_VALUES: readonly string[] = PAGE_WIDTH_OPTIONS.map((o) => o.value);

/**
 * The page's paper colour. "default" keeps the page style's own paper; the
 * others are light papers that keep every style's ink, muted text and line
 * colours readable (each is at least as light as the styles' own papers, so
 * contrast only improves). Stored as a preset name, never a free colour.
 */
export type Paper = "default" | "white" | "warm" | "cool";

export const PAPER_OPTIONS: ReadonlyArray<{ name: string; value: Paper; color?: string }> = [
  { name: "Style default", value: "default" },
  { name: "White", value: "white", color: "#ffffff" },
  { name: "Warm", value: "warm", color: "#fbf7ef" },
  { name: "Cool", value: "cool", color: "#f6f8fa" },
];

const PAPER_VALUES: readonly string[] = PAPER_OPTIONS.map((o) => o.value);

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
export const STYLE_OPTIONS: ReadonlyArray<{
  name: string;
  value: SiteStyle;
  /** One line for the picker. */
  hint: string;
  /** The style's own paper, ink, line colour and type, for the picker tile
   *  (mirrors its `.site-style-<value>` block in globals.css). */
  swatch: { paper: string; ink: string; line: string; font: string };
}> = [
  {
    name: "Warm Blueprint",
    value: "warm-blueprint-brutalism",
    hint: "Warm paper, serif headings, drawing-office details",
    swatch: { paper: "#faf8f4", ink: "#2a2420", line: "#cbbfa8", font: "Georgia, serif" },
  },
  {
    name: "Stone & Slate",
    value: "stone-slate",
    hint: "Calm stone and slate, plain sans type",
    swatch: { paper: "#fafaf9", ink: "#1c1917", line: "#cbd5e1", font: "system-ui, sans-serif" },
  },
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
  /** How wide the whole page is (see `PageWidth`). */
  pageWidth?: PageWidth;
  /** Paper colour preset (see `Paper`). */
  paper?: Paper;
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
  Pick<SiteTheme, "accent" | "font" | "radius" | "style" | "marginPattern" | "pageWidth" | "paper">
> = {
  accent: ACCENT_SWATCHES[0]?.value ?? "#0f172a",
  font: FONT_STACKS[0]?.value ?? "ui-sans-serif, system-ui, -apple-system, sans-serif",
  radius: "soft",
  style: "warm-blueprint-brutalism",
  marginPattern: "none",
  pageWidth: "classic",
  paper: "default",
};

/** A theme with every picker field filled — stored values, else defaults. */
export type ResolvedTheme = typeof DEFAULT_THEME;

export function resolveTheme(theme: SiteTheme): ResolvedTheme {
  return {
    accent: theme.accent ?? DEFAULT_THEME.accent,
    font: theme.font ?? DEFAULT_THEME.font,
    radius: theme.radius ?? DEFAULT_THEME.radius,
    style: theme.style ?? DEFAULT_THEME.style,
    marginPattern: theme.marginPattern ?? DEFAULT_THEME.marginPattern,
    pageWidth: theme.pageWidth ?? DEFAULT_THEME.pageWidth,
    paper: theme.paper ?? DEFAULT_THEME.paper,
  };
}

/** Rounding presets offered in the picker, mapped to the `--radius-card` value. */
export const RADIUS_PRESETS: ReadonlyArray<{ name: string; value: RadiusPreset }> = [
  { name: "Sharp", value: "sharp" },
  { name: "Soft", value: "soft" },
  { name: "Round", value: "round" },
];

/** Corner radius for images (`--site-radius`) and buttons (`--site-radius-button`). */
const RADIUS_VALUES: Record<RadiusPreset, { media: string; button: string }> = {
  sharp: { media: "0px", button: "0px" },
  soft: { media: "6px", button: "6px" },
  round: { media: "14px", button: "9999px" },
};

function parseRadius(v: unknown): RadiusPreset | undefined {
  if (v === "pill") return "round";
  return v === "sharp" || v === "soft" || v === "round" ? v : undefined;
}

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
    radius: parseRadius(radius),
    style: style === "warm-blueprint-brutalism" || style === "stone-slate" ? style : undefined,
    marginPattern:
      typeof marginPattern === "string" && MARGIN_PATTERN_VALUES.includes(marginPattern)
        ? (marginPattern as MarginPattern)
        : undefined,
    pageWidth:
      typeof v.pageWidth === "string" && PAGE_WIDTH_VALUES.includes(v.pageWidth)
        ? (v.pageWidth as PageWidth)
        : undefined,
    paper:
      typeof v.paper === "string" && PAPER_VALUES.includes(v.paper)
        ? (v.paper as Paper)
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
  if (theme.radius) {
    const r = RADIUS_VALUES[theme.radius];
    style["--radius-card"] = r.media;
    style["--site-radius"] = r.media;
    style["--site-radius-button"] = r.button;
  }
  const paper = PAPER_OPTIONS.find((p) => p.value === theme.paper)?.color;
  if (paper) style["--color-background"] = paper;
  return style;
}

/**
 * Everything a public page (or a preview of one) needs on its wrapper:
 * the shared `site-public` structure plus one class per theme dimension, and
 * the inline custom properties. The ONE place a theme becomes page styling,
 * so the published page, custom domains and every preview can't drift apart.
 */
export function sitePageProps(theme: SiteTheme): { className: string; style: CSSProperties } {
  const t = resolveTheme(theme);
  return {
    className: [
      "site-public",
      `site-style-${t.style}`,
      `site-margin-${t.marginPattern}`,
      `site-width-${t.pageWidth}`,
    ].join(" "),
    style: themeToStyle(t),
  };
}

/** Builder previews: the style classes only (no page structure or width). */
export function sitePreviewClassName(theme: SiteTheme): string {
  const t = resolveTheme(theme);
  return `site-style-${t.style} site-margin-${t.marginPattern}`;
}

/**
 * A fully resolved theme that keeps ONLY curated values: anything not offered
 * by a picker falls back to the default. For input that never went through a
 * server-side Zod check — preview query strings and preview messages — so a
 * crafted URL can only ever show a look the picker could have produced.
 */
export function curatedTheme(value: unknown): ResolvedTheme {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const one = <T extends string>(opts: ReadonlyArray<{ value: T }>, x: unknown, d: T): T =>
    opts.find((o) => o.value === x)?.value ?? d;
  return {
    accent: one(ACCENT_SWATCHES, v.accent, DEFAULT_THEME.accent),
    font: one(FONT_STACKS, v.font, DEFAULT_THEME.font),
    radius: one(RADIUS_PRESETS, parseRadius(v.radius), DEFAULT_THEME.radius),
    style: one(STYLE_OPTIONS, v.style, DEFAULT_THEME.style),
    marginPattern: one(MARGIN_PATTERN_OPTIONS, v.marginPattern, DEFAULT_THEME.marginPattern),
    pageWidth: one(PAGE_WIDTH_OPTIONS, v.pageWidth, DEFAULT_THEME.pageWidth),
    paper: one(PAPER_OPTIONS, v.paper, DEFAULT_THEME.paper),
  };
}

/** The message a Site look form posts to its preview frame. */
export const THEME_PREVIEW_MESSAGE = "hio:theme-preview";
