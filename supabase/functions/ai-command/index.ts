// ai-command — the AI editor, schema-driven by @hio/ai-engine. Serves BOTH products
// from one function (M4.5): Self-Serve user sites and Studio per-client sites.
//
// This Deno function owns ONLY the security-critical wiring: CORS, JWT verify,
// membership check, service-role isolation, and the Anthropic call. All the product
// logic (which tools exist, how each mutation is validated + applied) comes from the
// shared engine, which reads it from a SchemaProvider. Every request targets the
// unified tenant model:
//   • { tenant_id, site_id } → BOTH products. Tenant membership gates access; the
//                              tenant's schema_variant picks the provider (resolveVariant).
//                              A self_serve tenant resolves to the self-serve bundle
//                              (== selfServeSchema); a studio_client to its per-client variant.
// The legacy { page_id } path was removed in the CONTRACT phase (pages/page_id dropped).
// The engine code is identical for both products — only the provider and the rows differ.
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
import { type SchemaProvider, resolveVariant } from "@hio/content-model";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

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

interface EditTarget {
  provider: SchemaProvider;
  sections: SectionRecord[];
}

/**
 * Resolves which provider and section set this request edits, enforcing the
 * membership boundary by hand (the admin client bypasses RLS). Returns a `Response`
 * to short-circuit on any auth/lookup failure, or the `EditTarget`.
 *
 *  • `{ tenant_id, site_id }` → both products: caller must be a member of the tenant
 *    and the site must belong to it; provider = resolveVariant(schema_variant)
 *    (self_serve → self-serve bundle; studio_client → its per-client variant).
 */
async function resolveTarget(
  admin: SupabaseClient,
  userId: string,
  ids: { tenant_id?: string; site_id?: string },
): Promise<EditTarget | Response> {
  const sectionsFor = async (siteId: string) => {
    const { data } = await admin
      .from("sections")
      .select("id, type, content")
      .eq("site_id", siteId)
      .order("order");
    return (data ?? []) as SectionRecord[];
  };

  if (ids.tenant_id && ids.site_id) {
    // Unified path (self_serve or studio_client): membership gates access; the
    // tenant's schema_variant picks the provider — no kind filter, both are tenants.
    const { data: membership } = await admin
      .from("tenant_members")
      .select("tenant_id")
      .eq("tenant_id", ids.tenant_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership) return json({ ok: false, message: "Not found." }, 404);

    const { data: tenant } = await admin
      .from("tenants")
      .select("schema_variant")
      .eq("id", ids.tenant_id)
      .maybeSingle();
    if (!tenant) return json({ ok: false, message: "Not found." }, 404);

    const { data: site } = await admin
      .from("sites")
      .select("id")
      .eq("id", ids.site_id)
      .eq("tenant_id", ids.tenant_id)
      .maybeSingle();
    if (!site) return json({ ok: false, message: "Site not found." }, 404);

    let provider: SchemaProvider;
    try {
      provider = resolveVariant(ids.tenant_id, tenant.schema_variant);
    } catch {
      return json({ ok: false, message: "This client's schema is misconfigured." }, 500);
    }
    return { provider, sections: await sectionsFor(ids.site_id) };
  }

  return json({ ok: false, message: "Missing tenant_id + site_id." }, 400);
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

    const { prompt, tenant_id, site_id } = (await req.json()) as {
      prompt?: string;
      tenant_id?: string;
      site_id?: string;
    };
    if (!prompt) return json({ ok: false, message: "Missing prompt." }, 400);

    // Service-role client: bypasses RLS, so every access below is gated by hand.
    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve the provider + section set (membership-gated). A resolution failure
    // returns a Response; success returns the provider + the rows to edit.
    const target = await resolveTarget(admin, user.id, { tenant_id, site_id });
    if (target instanceof Response) return target;
    const { provider, sections } = target;

    // The engine builds Claude's tools from the schema; we never hard-code them here.
    const tools = buildClaudeTools(provider);
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

    const result = await executeTool(provider, toolUse.name, toolUse.input, sections, store);

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
