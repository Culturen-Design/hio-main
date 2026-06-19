/**
 * @hio/ai-engine — schema-driven AI content editor (shared by both products).
 *
 * This module owns the PRODUCT-AGNOSTIC core: turning a `SchemaProvider` into
 * Claude tool declarations, validating tool input server-side, and applying the
 * resulting mutation to a section's content. The engine never hard-codes module
 * types — it reads them from the provider it is given.
 *
 * The hard, security-critical wiring (JWT verify, ownership check, service-role
 * isolation, the Anthropic call) lives in the edge function that consumes this
 * package (`supabase/functions/ai-command`). Persistence is abstracted behind the
 * `SectionStore` port so the engine stays pure and unit-testable. Seeded from
 * exploration/hio-builder:supabase/functions/ai-command/index.ts, generalized.
 *
 * Portable by design: depends only on `zod` + `zod-to-json-schema`, so it runs
 * unchanged under Node (tests) and Deno (the edge function, via an import map).
 */
import type { AiToolDescriptor, ModuleType, SchemaProvider } from "@hio/content-model";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/** Minimal Anthropic tool shape (avoids a hard SDK dep in this package). */
export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** Name of the engine's built-in, module-agnostic content-edit tool. */
export const UPDATE_CONTENT_TOOL = "update_module_content";

/** Fields the AI may never write — they govern identity, layout, and style. */
export const PROTECTED_FIELDS = [
  "id",
  "page_id",
  "type",
  "order",
  "width",
  "style_variant",
] as const;
const PROTECTED = new Set<string>(PROTECTED_FIELDS);

export const SYSTEM_PROMPT = `You are a page editor assistant. You help users manage the content of their page by calling the tools provided.

RULES:
- Make changes ONLY by calling tools. Never describe a change without calling a tool.
- Modify content fields only. You cannot change module types, layout, or style variants.
- Before acting on ambiguous requests, ask one clarifying question.
- After calling a tool, confirm what changed in one or two plain sentences.
- Keep responses short unless the user asks for detail.
- If asked to do something outside your scope (change colours, add modules, change layout), explain briefly that those are handled through the visual controls, not chat.
- Dates must be ISO 8601 (YYYY-MM-DD). Resolve relative dates like "next Friday" to the actual date before calling a tool.
- Never fabricate content.`;

/* ── Persistence port ───────────────────────────────────────────────────────── */

/** The minimal view of a section the engine reads. */
export interface SectionRecord {
  id: string;
  type: string;
  content: Record<string, unknown> | null;
}

/** How the engine persists a mutated section. Implemented by the caller. */
export interface SectionStore {
  /** Persist new content for a section. Returns true on success. */
  updateContent(sectionId: string, content: Record<string, unknown>): Promise<boolean>;
}

export interface ToolResult {
  ok: boolean;
  message: string;
}

/* ── Claude tool generation ─────────────────────────────────────────────────── */

/** Convert a Zod schema to a clean JSON Schema object for the Anthropic API. */
function jsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  // Drop the top-level `$schema` key — the Anthropic tools API doesn't want it.
  const { $schema, ...rest } = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  void $schema;
  return rest;
}

/**
 * Build the Claude tool array: the built-in `update_module_content` (works for
 * every module) plus every collection tool the active provider declares.
 */
export function buildClaudeTools(provider: SchemaProvider): ClaudeTool[] {
  const builtIn: ClaudeTool = {
    name: UPDATE_CONTENT_TOOL,
    description:
      "Updates one or more text/content fields of a module. Use for headlines, body copy, titles, descriptions, labels. Pass the section id and a partial object containing ONLY the fields to change.",
    input_schema: {
      type: "object",
      properties: {
        section_id: { type: "string", description: "Id of the section/module to edit." },
        updates: {
          type: "object",
          description: "Partial content object — only the fields to change.",
        },
      },
      required: ["section_id", "updates"],
    },
  };

  const declared = provider.allTools().map((t: AiToolDescriptor) => ({
    name: t.name,
    description: t.description,
    input_schema: jsonSchema(t.inputSchema),
  }));

  return [builtIn, ...declared];
}

/* ── Page context for the system prompt ─────────────────────────────────────── */

/** Render the current page state Claude needs to target the right section. */
export function buildPageContext(sections: SectionRecord[]): string {
  if (!sections.length) return "The page has no modules yet.";
  return `Current page modules:\n${sections
    .map((s) => `- id: ${s.id} | type: ${s.type}\n  content: ${JSON.stringify(s.content ?? {})}`)
    .join("\n")}`;
}

/* ── Validation ─────────────────────────────────────────────────────────────── */

const updateInputSchema = z.object({
  section_id: z.string(),
  updates: z.record(z.unknown()),
});

/** Validate a tool's input server-side. Covers the built-in tool and provider tools. */
export function validateToolInput(
  provider: SchemaProvider,
  toolName: string,
  input: unknown,
): { ok: true; data: unknown } | { ok: false; error: string } {
  if (toolName === UPDATE_CONTENT_TOOL) {
    const parsed = updateInputSchema.safeParse(input);
    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, error: parsed.error.message };
  }
  const tool = provider.allTools().find((t) => t.name === toolName);
  if (!tool) return { ok: false, error: `Unknown tool: ${toolName}` };
  const parsed = tool.inputSchema.safeParse(input);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, error: parsed.error.message };
}

/* ── Execution ──────────────────────────────────────────────────────────────── */

/** Validate the post-mutation content against the target module's schema, if known. */
function validateAgainstModule(
  provider: SchemaProvider,
  type: string,
  content: Record<string, unknown>,
): { ok: true } | { ok: false; error: string } {
  const def = provider.getModule(type as ModuleType);
  if (!def) return { ok: true }; // unknown module type — nothing to validate against
  const parsed = def.contentSchema.safeParse(content);
  return parsed.success ? { ok: true } : { ok: false, error: parsed.error.message };
}

/**
 * Validate and apply a single tool call against the in-memory `sections`,
 * persisting the result through `store`. Pure aside from the injected `store`
 * and `genId`, so it is fully unit-testable.
 */
export async function executeTool(
  provider: SchemaProvider,
  toolName: string,
  rawInput: unknown,
  sections: SectionRecord[],
  store: SectionStore,
  genId: () => string = () => crypto.randomUUID(),
): Promise<ToolResult> {
  const valid = validateToolInput(provider, toolName, rawInput);
  if (!valid.ok) return { ok: false, message: `Invalid request: ${valid.error}` };

  /* Built-in module-agnostic content edit. */
  if (toolName === UPDATE_CONTENT_TOOL) {
    const input = valid.data as z.infer<typeof updateInputSchema>;
    const section = sections.find((s) => s.id === input.section_id);
    if (!section) return { ok: false, message: "Section not found." };

    const forbidden = Object.keys(input.updates).filter((k) => PROTECTED.has(k));
    if (forbidden.length) {
      return { ok: false, message: `Cannot update protected fields: ${forbidden.join(", ")}` };
    }

    const newContent = { ...(section.content ?? {}), ...input.updates };
    const check = validateAgainstModule(provider, section.type, newContent);
    if (!check.ok) return { ok: false, message: `Those values aren't valid: ${check.error}` };

    const saved = await store.updateContent(section.id, newContent);
    if (!saved) return { ok: false, message: "Failed to save changes." };
    return { ok: true, message: `Updated the ${section.type} module.` };
  }

  /* Provider-declared collection tool — interpret its op. */
  const tool = provider.allTools().find((t) => t.name === toolName);
  if (!tool) return { ok: false, message: `Unknown tool: ${toolName}` };
  const input = valid.data as Record<string, unknown>;
  const section = sections.find((s) => s.id === input.section_id);
  if (!section) return { ok: false, message: "Section not found." };

  const content = { ...(section.content ?? {}) };
  const op = tool.op;
  const current = Array.isArray(content[op.field]) ? [...(content[op.field] as unknown[])] : [];
  let message: string;

  switch (op.kind) {
    case "appendItem": {
      const item = { ...(input[op.itemKey] as Record<string, unknown>) };
      if (op.genId) item.id = genId();
      content[op.field] = [...current, item];
      message = "Added a new item.";
      break;
    }
    case "updateItem": {
      const id = input[op.idKey];
      let hit = false;
      content[op.field] = current.map((x) => {
        const row = x as Record<string, unknown>;
        if (row.id !== id) return row;
        hit = true;
        return { ...row, ...(input[op.itemKey] as Record<string, unknown>) };
      });
      if (!hit) return { ok: false, message: "That item was not found." };
      message = "Updated the item.";
      break;
    }
    case "removeItem": {
      const id = input[op.idKey];
      const next = current.filter((x) => (x as Record<string, unknown>).id !== id);
      if (next.length === current.length) return { ok: false, message: "That item was not found." };
      content[op.field] = next;
      message = "Removed the item.";
      break;
    }
  }

  const check = validateAgainstModule(provider, section.type, content);
  if (!check.ok) return { ok: false, message: `Those values aren't valid: ${check.error}` };

  const saved = await store.updateContent(section.id, content);
  if (!saved) return { ok: false, message: "Failed to save changes." };
  return { ok: true, message };
}
