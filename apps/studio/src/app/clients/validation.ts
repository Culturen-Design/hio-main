import { MODULE_BUNDLES } from "@hio/content-model";
import {
  ACCENT_SWATCHES,
  FONT_STACKS,
  MARGIN_PATTERN_OPTIONS,
  RADIUS_PRESETS,
  STYLE_OPTIONS,
} from "@hio/ui";
import { z } from "zod";

/** The schema_variant bundles a client may be assigned — the keys of the
 *  content-model registry's `MODULE_BUNDLES`. New bundles (additive content-model
 *  changes) appear here automatically. */
export const SCHEMA_VARIANTS = Object.keys(MODULE_BUNDLES) as [string, ...string[]];

const slug = z
  .string()
  .min(1, "Slug is required")
  .max(63, "Slug is too long")
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only");

/** Input for creating a Studio client (the New-client form). */
export const newClientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  slug,
  schema_variant: z.enum(SCHEMA_VARIANTS),
});
export type NewClientInput = z.infer<typeof newClientSchema>;

/** Input for editing a client's settings (name + bundle). */
export const updateClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  schema_variant: z.enum(SCHEMA_VARIANTS),
});
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

/** A normalized hostname (lowercase labels + TLD, no scheme/port/path). Mirrors the
 *  CHECK on tenants.custom_domain (migration 011). */
export const customDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253, "Domain is too long")
  .regex(
    /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
    "Enter a valid domain, e.g. example.com (no http:// or path)",
  );

/** Input for mapping/clearing a client's custom domain. An empty string clears the
 *  mapping (→ null). */
export const updateCustomDomainSchema = z.object({
  id: z.string().uuid(),
  custom_domain: z
    .union([z.literal(""), customDomainSchema])
    .transform((v) => (v === "" ? null : v)),
});
export type UpdateCustomDomainInput = z.infer<typeof updateCustomDomainSchema>;

const accentValues = ACCENT_SWATCHES.map((s) => s.value) as [string, ...string[]];
const fontValues = FONT_STACKS.map((f) => f.value) as [string, ...string[]];
const radiusValues = RADIUS_PRESETS.map((r) => r.value) as [string, ...string[]];
const styleValues = STYLE_OPTIONS.map((s) => s.value) as [string, ...string[]];
const marginPatternValues = MARGIN_PATTERN_OPTIONS.map((p) => p.value) as [string, ...string[]];

/** Input for the per-site theming MVP (curated-only — the picker offers exactly
 *  these values, so anything else is a tampered request, not a custom choice). */
export const updateThemeSchema = z.object({
  id: z.string().uuid(),
  accent: z.enum(accentValues),
  font: z.enum(fontValues),
  radius: z.enum(radiusValues),
  style: z.enum(styleValues),
  marginPattern: z.enum(marginPatternValues),
});
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
