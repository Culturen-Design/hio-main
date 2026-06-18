/**
 * @hio/ai-engine — schema-driven AI content editor (shared by both products).
 *
 * The hard, security-critical logic (JWT verify, ownership check, service-role
 * isolation, prompt caching, protected-field guard, tool-gated mutations) is ported
 * from exploration/hio-builder:supabase/functions/ai-command/index.ts in M2/M3.
 *
 * This module owns the PRODUCT-AGNOSTIC core: turning a SchemaProvider into Claude
 * tool declarations and validating tool input server-side. The engine never hard-codes
 * module types — it reads them from the provider it is given.
 */
import type { AiToolDescriptor, SchemaProvider } from "@hio/content-model";

/** Minimal Anthropic tool shape (avoids a hard SDK dep in this package). */
export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/**
 * Build the Claude tool array from the active schema provider.
 * NOTE (M3): replace the placeholder input_schema with a real Zod→JSON-Schema
 * conversion (zod-to-json-schema) so the model sees exact field constraints.
 */
export function buildClaudeTools(provider: SchemaProvider): ClaudeTool[] {
  return provider.allTools().map((t: AiToolDescriptor) => ({
    name: t.name,
    description: t.description,
    input_schema: { type: "object" },
  }));
}

/** Validate a tool's input server-side against its declared Zod schema. */
export function validateToolInput(
  provider: SchemaProvider,
  toolName: string,
  input: unknown,
): { ok: true; data: unknown } | { ok: false; error: string } {
  const tool = provider.allTools().find((t) => t.name === toolName);
  if (!tool) return { ok: false, error: `Unknown tool: ${toolName}` };
  const parsed = tool.inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.message };
  return { ok: true, data: parsed.data };
}
