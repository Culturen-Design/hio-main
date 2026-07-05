import { ACCENT_SWATCHES, FONT_STACKS, RADIUS_PRESETS, STYLE_OPTIONS } from "@hio/ui";
import { z } from "zod";

const accentValues = ACCENT_SWATCHES.map((s) => s.value) as [string, ...string[]];
const fontValues = FONT_STACKS.map((f) => f.value) as [string, ...string[]];
const radiusValues = RADIUS_PRESETS.map((r) => r.value) as [string, ...string[]];
const styleValues = STYLE_OPTIONS.map((s) => s.value) as [string, ...string[]];

/** Curated-only: the picker offers exactly these values, so anything else is a
 *  tampered request, not a valid custom choice (out of MVP scope). */
export const updateThemeSchema = z.object({
  accent: z.enum(accentValues),
  font: z.enum(fontValues),
  radius: z.enum(radiusValues),
  style: z.enum(styleValues),
});
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
