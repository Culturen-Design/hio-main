/**
 * @hio/content-model — the pluggable seam.
 *
 * The AI engine is schema-driven: it is handed a `SchemaProvider` and generates
 * its Claude tool declarations + server-side validation from it. Self-Serve ships
 * ONE built-in provider (the modules below); Studio resolves a provider per client
 * (theme + allowed modules + per-client tools). No engine code changes per product.
 *
 * Seeded from exploration/hio-builder:src/types/module.ts, generalized.
 */
import { z } from "zod";

export type StyleVariant = "minimal" | "bold" | "outlined" | "filled";

export type ModuleType =
  | "hero"
  | "bio"
  | "services"
  | "calendar"
  | "links"
  | "contact"
  | "gallery"
  | "testimonial"
  | "custom";

/* ── Content schemas (Zod = single source of truth; types are inferred) ─────── */

export const heroSchema = z.object({
  headline: z.string().max(80),
  subheadline: z.string().max(160).optional(),
  eyebrow: z.string().max(40).optional(),
  cta_label: z.string().max(30).optional(),
  cta_url: z.string().url().optional(),
});

export const linkItemSchema = z.object({
  id: z.string(),
  title: z.string().max(60),
  url: z.string().url(),
  description: z.string().max(120).optional(),
  icon: z.string().optional(),
});
export const linksSchema = z.object({
  title: z.string(),
  items: z.array(linkItemSchema).max(12),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
});

export const calendarEventSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO 8601 YYYY-MM-DD"),
  time: z.string().optional(),
  title: z.string().max(80),
  description: z.string().max(300).optional(),
  location: z.string().max(100).optional(),
  url: z.string().url().optional(),
});
export const calendarSchema = z.object({
  title: z.string(),
  events: z.array(calendarEventSchema),
  show_past: z.boolean(),
});

export type HeroContent = z.infer<typeof heroSchema>;
export type LinksContent = z.infer<typeof linksSchema>;
export type CalendarContent = z.infer<typeof calendarSchema>;

/* ── AI tool descriptors — the per-module capabilities the AI may invoke ────── */

export interface AiToolDescriptor {
  /** Tool name surfaced to Claude. */
  name: string;
  /** One-line description for the model. */
  description: string;
  /** Validates the tool input server-side before it runs. */
  inputSchema: z.ZodTypeAny;
  /** Which module type this tool operates on. */
  moduleType: ModuleType;
}

export interface ModuleDefinition<TContent = unknown> {
  type: ModuleType;
  label: string;
  contentSchema: z.ZodType<TContent>;
  /** Sensible default content when a module of this type is created. */
  defaults: TContent;
  /** Allowed layout width range [min, max] in a 12-col grid. */
  width: [number, number];
  /** AI capabilities for this module (empty = AI cannot edit it). */
  aiTools: AiToolDescriptor[];
}

export interface SchemaProvider {
  /** Stable id (e.g. "self-serve" or a client id for Studio). */
  id: string;
  modules: ModuleDefinition[];
  getModule(type: ModuleType): ModuleDefinition | undefined;
  /** Flattened tool list across all modules — the engine builds Claude tools from this. */
  allTools(): AiToolDescriptor[];
}

export function createSchemaProvider(id: string, modules: ModuleDefinition[]): SchemaProvider {
  const byType = new Map(modules.map((m) => [m.type, m]));
  return {
    id,
    modules,
    getModule: (type) => byType.get(type),
    allTools: () => modules.flatMap((m) => m.aiTools),
  };
}
