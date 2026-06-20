// ─────────────────────────────────────────────────────────────────────────
// GENERATED — DO NOT EDIT. Vendored from packages/content-model/src/index.ts (@hio/content-model).
// Edit the source package, then run `npm run bundle:ai-command`.
// CI fails if this file drifts from the package (.github/workflows/ci.yml).
// ─────────────────────────────────────────────────────────────────────────

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

/**
 * The built-in Self-Serve schema. Studio (M4) resolves a different provider per
 * client; the engine + renderers never hard-code module types.
 */
export const selfServeSchema = createSchemaProvider("self-serve", [
  heroModule,
  bioModule,
  linksModule,
  calendarModule,
]);

/** Default content for a freshly-added module of the given type, resolved against
 *  the given provider (defaults to the built-in Self-Serve one). Studio passes its
 *  per-client provider so defaults follow that client's module set. */
export function defaultContentFor(
  type: ModuleType,
  provider: SchemaProvider = selfServeSchema,
): unknown {
  return provider.getModule(type)?.defaults ?? {};
}
