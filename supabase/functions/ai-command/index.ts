// ai-command — the AI page editor, schema-driven by @hio/ai-engine.
//
// This Deno function owns ONLY the security-critical wiring: CORS, JWT verify,
// page-ownership check, service-role isolation, and the Anthropic call. All the
// product logic (which tools exist, how each mutation is validated + applied)
// comes from the shared engine, which reads it from a SchemaProvider. Self-Serve
// passes its one built-in schema; Studio (M4) will pass a per-client schema.
//
// Imports resolve via ./deno.json (npm: for third-party, relative for @hio/*).
import Anthropic from "@anthropic-ai/sdk";
import {
  SYSTEM_PROMPT,
  type SectionRecord,
  type SectionStore,
  buildClaudeTools,
  buildPageContext,
  executeTool,
} from "@hio/ai-engine";
import { selfServeSchema } from "@hio/content-model";
import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Read a required environment variable or fail loudly (server misconfig → 500). */
function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ ok: false, message: "AI chat is not configured yet." }, 503);

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return json({ ok: false, message: "Unauthorized." }, 401);

    const supabaseUrl = env("SUPABASE_URL");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = env("SUPABASE_ANON_KEY");

    // Verify the caller's JWT and resolve the user (anon key + their bearer token).
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) return json({ ok: false, message: "Unauthorized." }, 401);

    const { prompt, page_id } = (await req.json()) as { prompt?: string; page_id?: string };
    if (!prompt || !page_id) return json({ ok: false, message: "Missing prompt or page_id." }, 400);

    // Service-role client: bypasses RLS, so every access below is ownership-gated by hand.
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: page } = await admin
      .from("pages")
      .select("id")
      .eq("id", page_id)
      .eq("user_id", user.id)
      .single();
    if (!page) return json({ ok: false, message: "Page not found." }, 404);

    const { data: rows } = await admin
      .from("sections")
      .select("id, type, content")
      .eq("page_id", page_id)
      .order("order");
    const sections = (rows ?? []) as SectionRecord[];

    // The engine builds Claude's tools from the schema; we never hard-code them here.
    const tools = buildClaudeTools(selfServeSchema);
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: Deno.env.get("ANTHROPIC_MODEL") ?? DEFAULT_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: `${SYSTEM_PROMPT}\n\n${buildPageContext(sections)}`,
          cache_control: { type: "ephemeral" },
        },
        // biome-ignore lint/suspicious/noExplicitAny: cache_control isn't in the SDK's base param type
      ] as any,
      // biome-ignore lint/suspicious/noExplicitAny: engine's ClaudeTool shape matches the SDK at runtime
      tools: tools as any,
      tool_choice: { type: "auto" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : undefined;

    if (!toolUse || toolUse.type !== "tool_use") {
      // Claude replied with text only (clarifying question or out-of-scope).
      return json({ ok: true, message: text ?? "I didn't understand that request." });
    }

    const store: SectionStore = {
      async updateContent(sectionId, content) {
        const { error } = await admin.from("sections").update({ content }).eq("id", sectionId);
        return !error;
      },
    };

    const result = await executeTool(selfServeSchema, toolUse.name, toolUse.input, sections, store);

    return json({
      ok: result.ok,
      tool: toolUse.name,
      // biome-ignore lint/suspicious/noExplicitAny: tool input is validated inside the engine
      section_id: (toolUse.input as any)?.section_id ?? null,
      message: result.ok ? (text ?? result.message) : result.message,
    });
  } catch (err) {
    console.error("ai-command error:", err);
    return json({ ok: false, message: "Something went wrong. Please try again." }, 500);
  }
});
