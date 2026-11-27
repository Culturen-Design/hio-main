import {
  ACCENT_SWATCHES,
  FONT_STACKS,
  MARGIN_PATTERN_OPTIONS,
  PAGE_WIDTH_OPTIONS,
  PAPER_OPTIONS,
  RADIUS_PRESETS,
  STYLE_OPTIONS,
} from "@hio/ui";
import { z } from "zod";

const accentValues = ACCENT_SWATCHES.map((s) => s.value) as [string, ...string[]];
const fontValues = FONT_STACKS.map((f) => f.value) as [string, ...string[]];
const radiusValues = RADIUS_PRESETS.map((r) => r.value) as [string, ...string[]];
const styleValues = STYLE_OPTIONS.map((s) => s.value) as [string, ...string[]];
const marginPatternValues = MARGIN_PATTERN_OPTIONS.map((p) => p.value) as [string, ...string[]];
const pageWidthValues = PAGE_WIDTH_OPTIONS.map((o) => o.value) as [string, ...string[]];
const paperValues = PAPER_OPTIONS.map((o) => o.value) as [string, ...string[]];

/** Curated-only: the picker offers exactly these values, so anything else is a
 *  tampered request, not a valid custom choice. */
export const updateThemeSchema = z.object({
  accent: z.enum(accentValues),
  font: z.enum(fontValues),
  radius: z.enum(radiusValues),
  style: z.enum(styleValues),
  marginPattern: z.enum(marginPatternValues),
  // Added with the Page width / Paper settings; older clients omit them.
  pageWidth: z.enum(pageWidthValues).default("classic"),
  paper: z.enum(paperValues).default("default"),
});
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
