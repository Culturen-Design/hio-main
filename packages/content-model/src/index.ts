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

// NOTE: `StyleVariant` (presentation-only) lives in `@hio/ui` as of the M3
// seam-freeze (2026-06-20). The content seam stays presentation-free: this
// package owns content + AI capabilities; theme/styling is resolved next to the
// provider in the UI layer. See `CONTRACT.md`.

/** Every module type the platform knows about. Single source of truth — the
 *  `ModuleType` union and any runtime checks (admin overrides, Zod enums) derive
 *  from this. Must stay in sync with the `module_type` enum in the DB.
 *
 *  FROZEN as a CLOSED set (M3 decision, 2026-06-20): products choose from these
 *  types; `custom` is the escape hatch for bespoke content. Opening the space to
 *  arbitrary per-client types is a deferred M4+ decision (it would also reshape
 *  the DB `module_type` enum). See `CONTRACT.md`. */
export const MODULE_TYPES = [
  "hero",
  "bio",
  "services",
  "calendar",
  "links",
  "contact",
  "gallery",
  "testimonial",
  "custom",
] as const;

export type ModuleType = (typeof MODULE_TYPES)[number];

/** Module types unlocked for every user on the free tier (mirrors the DB's
 *  `allowed_module_types()`). Overrides grant access to the rest. */
export const FREE_MODULE_TYPES: readonly ModuleType[] = ["hero", "bio", "links", "contact"];

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

/**
 * Declarative execution semantics for a tool. The engine interprets these
 * against a section's `content` — no per-product code lives in the engine.
 * Every op's input is expected to carry `section_id`; collection ops name the
 * array field they mutate. `update_module_content` is a built-in engine tool
 * (it works for every module) and is NOT declared here.
 */
export type AiToolOp =
  /** Append `input[itemKey]` to the `field` array (engine assigns an id when `genId`). */
  | { kind: "appendItem"; field: string; itemKey: string; genId?: boolean }
  /** Patch the array item whose id === `input[idKey]` with `input[itemKey]`. */
  | { kind: "updateItem"; field: string; idKey: string; itemKey: string }
  /** Remove the array item whose id === `input[idKey]`. */
  | { kind: "removeItem"; field: string; idKey: string };

export interface AiToolDescriptor {
  /** Tool name surfaced to Claude. */
  name: string;
  /** One-line description for the model. */
  description: string;
  /** Validates the tool input server-side before it runs (must include section_id). */
  inputSchema: z.ZodTypeAny;
  /** Which module type this tool operates on. */
  moduleType: ModuleType;
  /** How the engine applies this tool to the target section's content. */
  op: AiToolOp;
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

/**
 * Tool names the engine reserves for its built-in, module-agnostic tools. A
 * provider may not declare a tool with one of these names (it would be shadowed
 * and never dispatched). Mirrors `UPDATE_CONTENT_TOOL` in `@hio/ai-engine`;
 * duplicated here to keep the seam free of an engine dependency (the engine
 * depends on this package, never the reverse).
 */
export const RESERVED_TOOL_NAMES: readonly string[] = ["update_module_content"];

/**
 * Build a provider from a module list, enforcing the seam's invariants up front:
 * module types are unique, AI tool names are unique, and no tool name collides
 * with an engine built-in. These fail loudly at construction so a malformed
 * provider (Self-Serve's built-in or a Studio per-client one) can never reach the
 * engine, where a collision would silently resolve last-wins.
 */
export function createSchemaProvider(id: string, modules: ModuleDefinition[]): SchemaProvider {
  const byType = new Map<ModuleType, ModuleDefinition>();
  for (const m of modules) {
    if (byType.has(m.type)) {
      throw new Error(`SchemaProvider "${id}": duplicate module type "${m.type}".`);
    }
    byType.set(m.type, m);
  }

  const reserved = new Set(RESERVED_TOOL_NAMES);
  const seenTools = new Set<string>();
  for (const m of modules) {
    for (const t of m.aiTools) {
      if (reserved.has(t.name)) {
        throw new Error(`SchemaProvider "${id}": tool "${t.name}" is a reserved engine tool name.`);
      }
      if (seenTools.has(t.name)) {
        throw new Error(`SchemaProvider "${id}": duplicate AI tool name "${t.name}".`);
      }
      seenTools.add(t.name);
    }
  }

  return {
    id,
    modules,
    getModule: (type) => byType.get(type),
    allTools: () => modules.flatMap((m) => m.aiTools),
  };
}

/* ── Bio module schema ──────────────────────────────────────────────────────── */

export const bioSchema = z.object({
  title: z.string().max(60),
  body: z.string().max(800),
  photo_url: z.string().url().optional(),
  photo_alt: z.string().optional(),
});
export type BioContent = z.infer<typeof bioSchema>;

/* ── Contact module schema ──────────────────────────────────────────────────── */
// Free-tier module: a simple "get in touch" block. All fields are plain text, so
// the engine's built-in `update_module_content` tool edits them — no collection tools.

export const contactSchema = z.object({
  title: z.string().max(60),
  intro: z.string().max(300).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
});
export type ContactContent = z.infer<typeof contactSchema>;

/* ── Services module schema ─────────────────────────────────────────────────── */
// Collection module: a titled list of service offerings. The AI can add/update/remove
// items (like calendar events) plus edit the title via update_module_content.

export const serviceItemSchema = z.object({
  id: z.string(),
  name: z.string().max(80),
  description: z.string().max(300).optional(),
  price: z.string().max(40).optional(), // free-form: "$50", "from £100/hr", "Free"
});
export const servicesSchema = z.object({
  title: z.string(),
  items: z.array(serviceItemSchema).max(20),
});
export type ServicesContent = z.infer<typeof servicesSchema>;

/* ── Gallery module schema ──────────────────────────────────────────────────── */
// Collection module: a grid of images referenced by URL (users paste hosted image
// URLs — no upload pipeline; Supabase Storage upload is a future enhancement). The
// AI can add/update/remove images plus edit the title.

export const galleryImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  caption: z.string().max(160).optional(),
  alt: z.string().max(160).optional(),
});
export const gallerySchema = z.object({
  title: z.string(),
  images: z.array(galleryImageSchema).max(30),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
});
export type GalleryContent = z.infer<typeof gallerySchema>;

/* ── Testimonial module schema ──────────────────────────────────────────────── */
// Collection module: a list of quotes with attribution. The AI can add/update/remove
// testimonials plus edit the title.

export const testimonialItemSchema = z.object({
  id: z.string(),
  quote: z.string().max(500),
  author: z.string().max(80),
  role: z.string().max(120).optional(), // e.g. "CEO, Acme"
  avatar_url: z.string().url().optional(),
});
export const testimonialSchema = z.object({
  title: z.string(),
  items: z.array(testimonialItemSchema).max(20),
});
export type TestimonialContent = z.infer<typeof testimonialSchema>;

/* ── Per-module AI tools ────────────────────────────────────────────────────── */
// Text-field edits on any module are handled by the engine's built-in
// `update_module_content` tool. Modules only declare tools for collection
// (array) mutations the AI should be able to perform.

const linkInputSchema = linkItemSchema.omit({ id: true });

export const linksAiTools: AiToolDescriptor[] = [
  {
    name: "add_link",
    description: "Adds a link card to a links module. Requires a title and a valid URL.",
    moduleType: "links",
    inputSchema: z.object({ section_id: z.string(), link: linkInputSchema }),
    op: { kind: "appendItem", field: "items", itemKey: "link", genId: true },
  },
  {
    name: "remove_link",
    description: "Removes a link from a links module by its link id.",
    moduleType: "links",
    inputSchema: z.object({ section_id: z.string(), link_id: z.string() }),
    op: { kind: "removeItem", field: "items", idKey: "link_id" },
  },
];

const eventInputSchema = calendarEventSchema.omit({ id: true });

export const calendarAiTools: AiToolDescriptor[] = [
  {
    name: "add_event",
    description:
      "Adds an event to a calendar module. Date must be ISO 8601 (YYYY-MM-DD); resolve relative dates first.",
    moduleType: "calendar",
    inputSchema: z.object({ section_id: z.string(), event: eventInputSchema }),
    op: { kind: "appendItem", field: "events", itemKey: "event", genId: true },
  },
  {
    name: "update_event",
    description: "Updates fields of an existing calendar event, found by its event id.",
    moduleType: "calendar",
    inputSchema: z.object({
      section_id: z.string(),
      event_id: z.string(),
      updates: eventInputSchema.partial(),
    }),
    op: { kind: "updateItem", field: "events", idKey: "event_id", itemKey: "updates" },
  },
  {
    name: "remove_event",
    description: "Removes an event from a calendar module by its event id.",
    moduleType: "calendar",
    inputSchema: z.object({ section_id: z.string(), event_id: z.string() }),
    op: { kind: "removeItem", field: "events", idKey: "event_id" },
  },
];

const serviceInputSchema = serviceItemSchema.omit({ id: true });

export const servicesAiTools: AiToolDescriptor[] = [
  {
    name: "add_service",
    description:
      "Adds a service to a services module. Requires a name; description and price optional.",
    moduleType: "services",
    inputSchema: z.object({ section_id: z.string(), service: serviceInputSchema }),
    op: { kind: "appendItem", field: "items", itemKey: "service", genId: true },
  },
  {
    name: "update_service",
    description: "Updates fields of an existing service, found by its service id.",
    moduleType: "services",
    inputSchema: z.object({
      section_id: z.string(),
      service_id: z.string(),
      updates: serviceInputSchema.partial(),
    }),
    op: { kind: "updateItem", field: "items", idKey: "service_id", itemKey: "updates" },
  },
  {
    name: "remove_service",
    description: "Removes a service from a services module by its service id.",
    moduleType: "services",
    inputSchema: z.object({ section_id: z.string(), service_id: z.string() }),
    op: { kind: "removeItem", field: "items", idKey: "service_id" },
  },
];

const galleryImageInputSchema = galleryImageSchema.omit({ id: true });

export const galleryAiTools: AiToolDescriptor[] = [
  {
    name: "add_image",
    description:
      "Adds an image to a gallery module. Requires a valid image URL; caption/alt optional.",
    moduleType: "gallery",
    inputSchema: z.object({ section_id: z.string(), image: galleryImageInputSchema }),
    op: { kind: "appendItem", field: "images", itemKey: "image", genId: true },
  },
  {
    name: "update_image",
    description: "Updates fields of an existing gallery image, found by its image id.",
    moduleType: "gallery",
    inputSchema: z.object({
      section_id: z.string(),
      image_id: z.string(),
      updates: galleryImageInputSchema.partial(),
    }),
    op: { kind: "updateItem", field: "images", idKey: "image_id", itemKey: "updates" },
  },
  {
    name: "remove_image",
    description: "Removes an image from a gallery module by its image id.",
    moduleType: "gallery",
    inputSchema: z.object({ section_id: z.string(), image_id: z.string() }),
    op: { kind: "removeItem", field: "images", idKey: "image_id" },
  },
];

const testimonialInputSchema = testimonialItemSchema.omit({ id: true });

export const testimonialAiTools: AiToolDescriptor[] = [
  {
    name: "add_testimonial",
    description: "Adds a testimonial to a testimonial module. Requires a quote and an author.",
    moduleType: "testimonial",
    inputSchema: z.object({ section_id: z.string(), testimonial: testimonialInputSchema }),
    op: { kind: "appendItem", field: "items", itemKey: "testimonial", genId: true },
  },
  {
    name: "update_testimonial",
    description: "Updates fields of an existing testimonial, found by its testimonial id.",
    moduleType: "testimonial",
    inputSchema: z.object({
      section_id: z.string(),
      testimonial_id: z.string(),
      updates: testimonialInputSchema.partial(),
    }),
    op: { kind: "updateItem", field: "items", idKey: "testimonial_id", itemKey: "updates" },
  },
  {
    name: "remove_testimonial",
    description: "Removes a testimonial from a testimonial module by its testimonial id.",
    moduleType: "testimonial",
    inputSchema: z.object({ section_id: z.string(), testimonial_id: z.string() }),
    op: { kind: "removeItem", field: "items", idKey: "testimonial_id" },
  },
];

/* ── Module definitions ─────────────────────────────────────────────────────── */

export const heroModule: ModuleDefinition<HeroContent> = {
  type: "hero",
  label: "Hero",
  contentSchema: heroSchema,
  defaults: { headline: "Hello, I'm …", subheadline: "Welcome to my page." },
  width: [12, 12],
  aiTools: [],
};

export const bioModule: ModuleDefinition<BioContent> = {
  type: "bio",
  label: "Bio",
  contentSchema: bioSchema,
  defaults: { title: "About me", body: "Tell visitors a little about yourself." },
  width: [4, 12],
  aiTools: [],
};

export const linksModule: ModuleDefinition<LinksContent> = {
  type: "links",
  label: "Links",
  contentSchema: linksSchema,
  defaults: { title: "Links", items: [], columns: 2 },
  width: [4, 12],
  aiTools: linksAiTools,
};

export const calendarModule: ModuleDefinition<CalendarContent> = {
  type: "calendar",
  label: "Calendar",
  contentSchema: calendarSchema,
  defaults: { title: "Events", events: [], show_past: false },
  width: [6, 12],
  aiTools: calendarAiTools,
};

export const contactModule: ModuleDefinition<ContactContent> = {
  type: "contact",
  label: "Contact",
  contentSchema: contactSchema,
  defaults: { title: "Get in touch", intro: "I'd love to hear from you." },
  width: [4, 12],
  aiTools: [],
};

export const servicesModule: ModuleDefinition<ServicesContent> = {
  type: "services",
  label: "Services",
  contentSchema: servicesSchema,
  defaults: { title: "Services", items: [] },
  width: [4, 12],
  aiTools: servicesAiTools,
};

export const galleryModule: ModuleDefinition<GalleryContent> = {
  type: "gallery",
  label: "Gallery",
  contentSchema: gallerySchema,
  defaults: { title: "Gallery", images: [], columns: 3 },
  width: [6, 12],
  aiTools: galleryAiTools,
};

export const testimonialModule: ModuleDefinition<TestimonialContent> = {
  type: "testimonial",
  label: "Testimonials",
  contentSchema: testimonialSchema,
  defaults: { title: "What people say", items: [] },
  width: [4, 12],
  aiTools: testimonialAiTools,
};

/* ── Module registry & per-tenant provider resolution (M4.2) ────────────────── */

/**
 * The closed registry of every module the platform has actually built, keyed by
 * `ModuleType`. This is the single source the resolver draws from — a tenant can
 * only enable a module that lives here. It is `Partial` by design: the
 * `ModuleType` space is the frozen closed union, but a type only appears here once
 * its `ModuleDefinition` (schema + renderer-side defaults + AI tools) exists.
 * Building a new module (`services`, `contact`, …) = add it here; that is additive
 * growth of the seam, not a contract change. See `CONTRACT.md`.
 */
export const MODULE_REGISTRY: Partial<Record<ModuleType, ModuleDefinition>> = {
  hero: heroModule,
  bio: bioModule,
  links: linksModule,
  calendar: calendarModule,
  contact: contactModule,
  services: servicesModule,
  gallery: galleryModule,
  testimonial: testimonialModule,
};

/** The built-in Self-Serve product surface. `hero`/`bio`/`links`/`contact` are the
 *  free-tier modules (mirrors the DB `allowed_module_types()` gate); `calendar`,
 *  `services`, `gallery`, and `testimonial` are in the palette but paid-gated by RLS.
 *  (`custom` is the only module type not yet built.) */
const SELF_SERVE_MODULE_TYPES: readonly ModuleType[] = [
  "hero",
  "bio",
  "links",
  "contact",
  "calendar",
  "services",
  "gallery",
  "testimonial",
];

/**
 * Named module bundles, keyed by the value stored in `tenants.schema_variant`.
 * A bundle is the closed list of module types a variant enables; the resolver
 * turns it into a per-tenant `SchemaProvider`. Studio (M4.3) sets a tenant's
 * `schema_variant` to one of these names when creating a client — onboarding is
 * an INSERT, never code (see `TENANCY.md`). New plans/variants are additive.
 */
export const MODULE_BUNDLES: Record<string, readonly ModuleType[]> = {
  "self-serve": SELF_SERVE_MODULE_TYPES,
};

/**
 * Build a per-tenant `SchemaProvider` from an explicit list of enabled module
 * types, resolved against `MODULE_REGISTRY`. This is the low-level resolver: the
 * engine is handed the result and never hard-codes module types. Throws if a
 * requested type has no registered definition (a tenant enabled a module that
 * hasn't been built yet) — failing loudly at resolution, never at request time.
 * `createSchemaProvider` then enforces the seam's uniqueness invariants.
 */
export function resolveProvider(id: string, enabledTypes: readonly ModuleType[]): SchemaProvider {
  const modules = enabledTypes.map((type) => {
    const def = MODULE_REGISTRY[type];
    if (!def) {
      throw new Error(
        `resolveProvider "${id}": module type "${type}" is not registered in MODULE_REGISTRY.`,
      );
    }
    return def;
  });
  return createSchemaProvider(id, modules);
}

/**
 * Resolve a provider from a tenant's `schema_variant` (a named bundle). This is
 * the seam Studio uses: a tenant row carries `schema_variant`; this maps it to its
 * bundle and builds the provider. Throws on an unknown variant rather than
 * silently serving an empty toolset.
 */
export function resolveVariant(id: string, variant: string): SchemaProvider {
  const bundle = MODULE_BUNDLES[variant];
  if (!bundle) {
    throw new Error(`resolveVariant "${id}": unknown schema_variant "${variant}".`);
  }
  return resolveProvider(id, bundle);
}

/**
 * The built-in Self-Serve schema, now expressed via the registry/bundle so it and
 * Studio's per-client providers are built the same way. Studio (M4) resolves a
 * different provider per client; the engine + renderers never hard-code module types.
 */
export const selfServeSchema = resolveProvider("self-serve", SELF_SERVE_MODULE_TYPES);

/** Default content for a freshly-added module of the given type, resolved against
 *  the given provider (defaults to the built-in Self-Serve one). Studio passes its
 *  per-client provider so defaults follow that client's module set. */
export function defaultContentFor(
  type: ModuleType,
  provider: SchemaProvider = selfServeSchema,
): unknown {
  return provider.getModule(type)?.defaults ?? {};
}
