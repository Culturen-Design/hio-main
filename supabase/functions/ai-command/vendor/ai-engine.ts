// ─────────────────────────────────────────────────────────────────────────
// GENERATED — DO NOT EDIT. Vendored from packages/ai-engine/src/index.ts (@hio/ai-engine).
// Edit the source package, then run `npm run bundle:ai-command`.
// CI fails if this file drifts from the package (.github/workflows/ci.yml).
// ─────────────────────────────────────────────────────────────────────────

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
/** Built-in section-CRUD tools (M2 widening, 2026-07-05): add a new, fully
 *  populated section of any provider-enabled type / remove a section. Names
 *  reserved in `RESERVED_TOOL_NAMES` alongside `update_module_content`. */
export const ADD_SECTION_TOOL = "add_section";
export const REMOVE_SECTION_TOOL = "remove_section";

/** Fields the AI may never write — they govern identity, layout, and style. */
export const PROTECTED_FIELDS = [
  "id",
  "tenant_id",
  "site_id",
  "type",
  "order",
  "width",
  "style_variant",
] as const;
const PROTECTED = new Set<string>(PROTECTED_FIELDS);

export const SYSTEM_PROMPT = `You are a page editor assistant. You help users manage the content of their page by calling the tools provided.

RULES:
- Make changes ONLY by calling tools. Never describe a change without calling a tool.
- You can edit a module's content fields, ADD a new section (add_section), and REMOVE a section (remove_section). You cannot change colours, fonts, layout, section order, or style variants — explain briefly that those are handled through the visual controls, not chat.
- When ADDING a section, fill EVERY field of that module's schema (see MODULE SCHEMAS) with realistic, well-written sample content the user can tweak afterwards — never an empty placeholder. Give collection modules 2–4 fleshed-out items. Where an image URL field exists and the user didn't provide one, use https://picsum.photos/seed/<one-word>/800/600 (vary the seed word per image). Sample content on a brand-new section is expected; everywhere else, never fabricate facts about the user's real business.
- Removing a section is destructive: call remove_section only when the user clearly asked to remove/delete that section, and target it by its section id from the page context.
- Before acting on ambiguous requests, ask one clarifying question.
- A multi-part request is fine: call the tools one after another (you'll see each tool's result before deciding the next step) until everything the user asked for is done. If a tool reports an error, fix your input and retry once before giving up.
- When you're done, confirm what changed in one or two plain sentences.
- Keep responses short unless the user asks for detail.
- Dates must be ISO 8601 (YYYY-MM-DD). Resolve relative dates like "next Friday" to the actual date before calling a tool.`;

/* ── Persistence port ───────────────────────────────────────────────────────── */

/** The minimal view of a section the engine reads. */
export interface SectionRecord {
  id: string;
  type: string;
  content: Record<string, unknown> | null;
}

/** How the engine persists a mutated section. Implemented by the caller.
 *  `insertSection`/`deleteSection` are OPTIONAL (additive, 2026-07-05): a store
 *  that omits them simply makes the section-CRUD tools report "not supported"
 *  — existing stores keep compiling unchanged. */
export interface SectionStore {
  /** Persist new content for a section. Returns true on success. */
  updateContent(sectionId: string, content: Record<string, unknown>): Promise<boolean>;
  /** Insert a new section of `type` with `content`. The caller owns placement
   *  (tenant/site ids, order, width). Returns true on success. */
  insertSection?(type: string, content: Record<string, unknown>): Promise<boolean>;
  /** Delete a section by id. Returns true only if a row was actually removed. */
  deleteSection?(sectionId: string): Promise<boolean>;
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
 * Build the Claude tool array: the built-ins — `update_module_content` (works
 * for every module) and the section-CRUD pair `add_section`/`remove_section`
 * (typed against the ACTIVE provider's module set, so a tenant can only be
 * offered types its own provider carries) — plus every collection tool the
 * provider declares.
 */
export function buildClaudeTools(provider: SchemaProvider): ClaudeTool[] {
  const update: ClaudeTool = {
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

  const addSection: ClaudeTool = {
    name: ADD_SECTION_TOOL,
    description:
      "Adds a new section/module to the end of the page, fully populated. Pass the module type and a COMPLETE content object matching that module's schema (see MODULE SCHEMAS in the system prompt) — fill every field with realistic sample content. Ids of collection items may be omitted (they are generated).",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: provider.modules.map((m) => m.type),
          description: "Module type to add.",
        },
        content: {
          type: "object",
          description: "Complete content for the new section, matching the module's schema.",
        },
      },
      required: ["type", "content"],
    },
  };

  const removeSection: ClaudeTool = {
    name: REMOVE_SECTION_TOOL,
    description:
      "Removes an entire section/module from the page by its section id. Destructive — only call when the user explicitly asked to remove/delete a section.",
    input_schema: {
      type: "object",
      properties: {
        section_id: { type: "string", description: "Id of the section to remove." },
      },
      required: ["section_id"],
    },
  };

  const declared = provider.allTools().map((t: AiToolDescriptor) => ({
    name: t.name,
    description: t.description,
    input_schema: jsonSchema(t.inputSchema),
  }));

  return [update, addSection, removeSection, ...declared];
}

/* ── Page context for the system prompt ─────────────────────────────────────── */

/**
 * Render each enabled module's content JSON Schema for the system prompt, so
 * the model knows the FULL field surface of every type — including optional
 * fields the current rows don't carry (it otherwise only ever sees the keys
 * present in the page context) — both to populate a new section completely
 * (add_section) and to set optional fields via update_module_content.
 */
export function buildSchemaContext(provider: SchemaProvider): string {
  const lines = provider.modules.map(
    (m) => `- ${m.type} ("${m.label}"): ${JSON.stringify(jsonSchema(m.contentSchema))}`,
  );
  return `MODULE SCHEMAS (the content shape of each module type):\n${lines.join("\n")}`;
}

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
const addSectionInputSchema = z.object({
  type: z.string(),
  content: z.record(z.unknown()).optional(),
});
const removeSectionInputSchema = z.object({
  section_id: z.string(),
});

/** Validate a tool's input server-side. Covers the built-in tools and provider tools. */
export function validateToolInput(
  provider: SchemaProvider,
  toolName: string,
  input: unknown,
): { ok: true; data: unknown } | { ok: false; error: string } {
  const builtIns: Record<string, z.ZodTypeAny> = {
    [UPDATE_CONTENT_TOOL]: updateInputSchema,
    [ADD_SECTION_TOOL]: addSectionInputSchema,
    [REMOVE_SECTION_TOOL]: removeSectionInputSchema,
  };
  const builtIn = builtIns[toolName];
  if (builtIn) {
    const parsed = builtIn.safeParse(input);
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

  /* Built-in section CRUD (2026-07-05). The provider is the type authority —
     a type it doesn't carry is rejected here; product-level enforcement
     (Self-Serve tier gate, Studio membership) rides the caller's store, which
     persists through an RLS-gated client exactly like the manual "+ Module"
     server actions. */
  if (toolName === ADD_SECTION_TOOL) {
    const input = valid.data as z.infer<typeof addSectionInputSchema>;
    const def = provider.getModule(input.type as ModuleType);
    if (!def) {
      const allowed = provider.modules.map((m) => m.type).join(", ");
      return {
        ok: false,
        message: `Module type "${input.type}" isn't available (try: ${allowed}).`,
      };
    }
    if (!store.insertSection) {
      return { ok: false, message: "Adding sections isn't supported here." };
    }

    const merged: Record<string, unknown> = {
      ...(def.defaults as Record<string, unknown>),
      ...(input.content ?? {}),
    };
    // Assign ids the model omitted on collection items (any object element of
    // any top-level array), mirroring the appendItem op's genId behaviour.
    for (const value of Object.values(merged)) {
      if (!Array.isArray(value)) continue;
      for (const el of value) {
        if (
          el &&
          typeof el === "object" &&
          typeof (el as Record<string, unknown>).id !== "string"
        ) {
          (el as Record<string, unknown>).id = genId();
        }
      }
    }

    const parsed = def.contentSchema.safeParse(merged);
    if (!parsed.success) {
      return { ok: false, message: `That content isn't valid: ${parsed.error.message}` };
    }

    const saved = await store.insertSection(def.type, parsed.data as Record<string, unknown>);
    if (!saved) {
      return {
        ok: false,
        message: "Couldn't add that section — it may not be available on this plan.",
      };
    }
    return { ok: true, message: `Added a new ${def.type} section.` };
  }

  if (toolName === REMOVE_SECTION_TOOL) {
    const input = valid.data as z.infer<typeof removeSectionInputSchema>;
    const section = sections.find((s) => s.id === input.section_id);
    if (!section) return { ok: false, message: "Section not found." };
    if (!store.deleteSection) {
      return { ok: false, message: "Removing sections isn't supported here." };
    }
    const removed = await store.deleteSection(section.id);
    if (!removed) return { ok: false, message: "Failed to remove that section." };
    return { ok: true, message: `Removed the ${section.type} section.` };
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

/* ── Agentic tool loop (AI edit sessions, 2026-07-12) ───────────────────────────
 *
 * Replaces the original single-shot "one prompt → at most one tool call" flow:
 * the model runs in a loop — call a tool, see its result, decide the next step —
 * until it answers with text or the iteration cap trips. Multi-part requests
 * complete instead of silently dropping everything after the first action, and
 * a failed tool call (e.g. Zod rejection) becomes something the model can fix
 * and retry rather than a dead-end error shown to the user.
 *
 * The Anthropic call is injected (`callModel`) so this stays SDK-free and
 * unit-testable with a scripted fake model, mirroring the SectionStore port.
 */

export interface TextBlock {
  type: "text";
  text: string;
}
export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}
export type AssistantContentBlock = TextBlock | ToolUseBlock;
export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/** One turn of the conversation, in the Messages-API shape (and how a turn is
 *  persisted: this exact structure round-trips through the ai_messages table). */
export type ConversationMessage =
  | { role: "user"; content: string | ToolResultBlock[] }
  | { role: "assistant"; content: AssistantContentBlock[] };

export interface ModelResponse {
  content: AssistantContentBlock[];
}
export type CallModel = (messages: ConversationMessage[]) => Promise<ModelResponse>;

/** One successfully applied tool call. `undoVersionId` carries whatever the
 *  caller's `beforeEdit` hook returned (a pre-edit snapshot id) to the client. */
export interface AppliedEdit {
  tool: string;
  sectionId: string | null;
  undoVersionId: string | null;
}

export interface ToolLoopResult {
  /** Final assistant text for the user. */
  reply: string;
  /** True when at least one tool call was applied — the canvas should refresh. */
  applied: boolean;
  edits: AppliedEdit[];
  /** The messages GENERATED this turn (the user prompt + every assistant /
   *  tool_result turn) — exactly what the caller should persist. */
  transcript: ConversationMessage[];
  iterations: number;
}

export const MAX_TOOL_ITERATIONS = 5;

/**
 * Prepare a stored transcript for the model: keep only the most recent
 * `maxMessages`, then drop leading messages until the window opens on a real
 * user prompt — an assistant-first window is rejected by the API, and a
 * tool_result-first window references a tool_use the model can no longer see.
 */
export function trimHistoryForModel(
  messages: ConversationMessage[],
  maxMessages = 40,
): ConversationMessage[] {
  const recent =
    messages.length > maxMessages ? messages.slice(messages.length - maxMessages) : [...messages];
  let first = recent[0];
  while (first && !(first.role === "user" && typeof first.content === "string")) {
    recent.shift();
    first = recent[0];
  }
  return recent;
}

export async function runToolLoop(options: {
  provider: SchemaProvider;
  callModel: CallModel;
  /** Prior turns (already trimmed via trimHistoryForModel). */
  history?: ConversationMessage[];
  prompt: string;
  /** Re-read between iterations so each tool executes against fresh rows. */
  loadSections: () => Promise<SectionRecord[]>;
  store: SectionStore;
  /** Called before each tool executes; its return value (e.g. a pre-edit
   *  snapshot id) is attached to the resulting AppliedEdit. Memoize inside the
   *  hook for once-per-request semantics. */
  beforeEdit?: (toolName: string, input: unknown) => Promise<string | null>;
  maxIterations?: number;
  genId?: () => string;
}): Promise<ToolLoopResult> {
  const { provider, callModel, prompt, loadSections, store, beforeEdit } = options;
  const history = options.history ?? [];
  const maxIterations = options.maxIterations ?? MAX_TOOL_ITERATIONS;

  const messages: ConversationMessage[] = [...history, { role: "user", content: prompt }];
  const edits: AppliedEdit[] = [];
  let reply = "";
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    const response = await callModel(messages);
    messages.push({ role: "assistant", content: response.content });

    // The latest text block wins: interim narration ("I'll update the hero…")
    // is superseded by the closing summary.
    const textBlock = response.content.find((b): b is TextBlock => b.type === "text");
    if (textBlock?.text) reply = textBlock.text;

    const toolUses = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
    if (toolUses.length === 0) break;

    const sections = await loadSections();
    const results: ToolResultBlock[] = [];
    for (const toolUse of toolUses) {
      const undoVersionId = beforeEdit ? await beforeEdit(toolUse.name, toolUse.input) : null;
      const result = await executeTool(
        provider,
        toolUse.name,
        toolUse.input,
        sections,
        store,
        options.genId,
      );
      results.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result.message,
        ...(result.ok ? {} : { is_error: true }),
      });
      if (result.ok) {
        const sectionId = (toolUse.input as { section_id?: unknown } | null)?.section_id;
        edits.push({
          tool: toolUse.name,
          sectionId: typeof sectionId === "string" ? sectionId : null,
          undoVersionId,
        });
      }
    }
    messages.push({ role: "user", content: results });
  }

  if (!reply) {
    reply = edits.length ? "Done — applied your changes." : "I couldn't complete that request.";
  }

  return {
    reply,
    applied: edits.length > 0,
    edits,
    transcript: messages.slice(history.length),
    iterations,
  };
}
