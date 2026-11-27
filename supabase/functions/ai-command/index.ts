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
// AI EDIT SESSIONS (2026-07-12): the model runs the engine's agentic tool loop
// (multi-step, self-correcting) over a SERVER-OWNED conversation. The client sends
// only an optional `session_id`; the authoritative transcript lives in ai_sessions/
// ai_messages (written exclusively here — a client can never forge history). Before
// the first applied edit of a request, the site is snapshotted ("Before AI edit")
// through the USER-scoped client, and the resulting version id rides back on each
// edit so the UI can offer one-click Undo via restore_site_version.
//
// Imports resolve via ./deno.json (npm: for third-party, relative for @hio/*).
import Anthropic from "@anthropic-ai/sdk";
import {
  type CallModel,
  type ConversationMessage,
  SYSTEM_PROMPT,
  type SectionRecord,
  type SectionStore,
  buildClaudeTools,
  buildPageContext,
  buildSchemaContext,
  runToolLoop,
  trimHistoryForModel,
} from "@hio/ai-engine";
import { type ModuleType, type SchemaProvider, resolveVariant } from "@hio/content-model";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
/** Most recent transcript rows loaded per request (trimHistoryForModel re-cuts
 *  the window so it always opens on a real user prompt). */
const HISTORY_LIMIT = 40;

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
  tenantId: string;
  siteId: string;
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
    return {
      provider,
      sections: await sectionsFor(ids.site_id),
      tenantId: ids.tenant_id,
      siteId: ids.site_id,
    };
  }

  return json({ ok: false, message: "Missing tenant_id + site_id." }, 400);
}

/** Resume the caller's session (must match tenant/site/creator) or start a new one. */
async function resolveSession(
  admin: SupabaseClient,
  args: { sessionId: unknown; tenantId: string; siteId: string; userId: string },
): Promise<string | null> {
  if (typeof args.sessionId === "string" && args.sessionId) {
    const { data: existing } = await admin
      .from("ai_sessions")
      .select("id")
      .eq("id", args.sessionId)
      .eq("tenant_id", args.tenantId)
      .eq("site_id", args.siteId)
      .eq("created_by", args.userId)
      .maybeSingle();
    if (existing) return existing.id as string;
    // Unknown/foreign session id → fall through and start fresh rather than 404:
    // the id is a resumption hint, not a credential.
  }

  const { data: created } = await admin
    .from("ai_sessions")
    .insert({ tenant_id: args.tenantId, site_id: args.siteId, created_by: args.userId })
    .select("id")
    .single();
  return (created?.id as string | undefined) ?? null;
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

    const { prompt, session_id, tenant_id, site_id } = (await req.json()) as {
      prompt?: string;
      session_id?: string;
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
    const { provider, sections, tenantId, siteId } = target;

    const sessionId = await resolveSession(admin, {
      sessionId: session_id,
      tenantId,
      siteId,
      userId: user.id,
    });
    if (!sessionId) return json({ ok: false, message: "Couldn't start an AI session." }, 500);

    // Server-owned history — written only by this function, so it can be trusted
    // as-is. Loaded newest-first for the LIMIT, then restored to chronological.
    const { data: historyRows } = await admin
      .from("ai_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);
    const history = trimHistoryForModel(
      ((historyRows ?? []).reverse() as ConversationMessage[]) ?? [],
    );

    // The engine builds Claude's tools from the schema; we never hard-code them
    // here. The schema context teaches the model each module type's FULL field
    // surface; the page context is rebuilt fresh every request, so the system
    // prompt always reflects current reality while the transcript carries intent.
    const tools = buildClaudeTools(provider);
    const anthropic = new Anthropic({ apiKey });
    const model = Deno.env.get("ANTHROPIC_MODEL") ?? DEFAULT_MODEL;
    const system = [
      {
        type: "text",
        text: `${SYSTEM_PROMPT}\n\n${buildSchemaContext(provider)}\n\n${buildPageContext(sections)}`,
        cache_control: { type: "ephemeral" },
      },
      // biome-ignore lint/suspicious/noExplicitAny: cache_control isn't in the SDK's base param type
    ] as any;

    const callModel: CallModel = async (messages) => {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system,
        // biome-ignore lint/suspicious/noExplicitAny: engine's ClaudeTool shape matches the SDK at runtime
        tools: tools as any,
        tool_choice: { type: "auto" },
        // biome-ignore lint/suspicious/noExplicitAny: engine's ConversationMessage is the SDK's message shape
        messages: messages as any,
      });
      return {
        content: response.content.filter(
          (b) => b.type === "text" || b.type === "tool_use",
          // biome-ignore lint/suspicious/noExplicitAny: narrowed to the engine's block union above
        ) as any,
      };
    };

    // Section CRUD deliberately writes through the USER-scoped client (anon key
    // + caller's JWT), not the service-role client: RLS then enforces exactly
    // what the manual "+ Module"/Delete builder actions enforce — tenant
    // membership on both products AND the Self-Serve tier gate
    // (allowed_module_types) on insert. A gated/foreign write fails or affects
    // 0 rows instead of silently succeeding with service-role power.
    const store: SectionStore = {
      async updateContent(sectionId, content) {
        const { error } = await admin.from("sections").update({ content }).eq("id", sectionId);
        return !error;
      },
      async insertSection(type, content) {
        const def = provider.getModule(type as ModuleType);
        const { count } = await admin
          .from("sections")
          .select("*", { count: "exact", head: true })
          .eq("site_id", siteId);
        const { error } = await userClient.from("sections").insert({
          tenant_id: tenantId,
          site_id: siteId,
          type,
          content,
          width: def?.width[1] ?? 12,
          order: count ?? 0,
        });
        return !error;
      },
      async deleteSection(sectionId) {
        const { error, count } = await userClient
          .from("sections")
          .delete({ count: "exact" })
          .eq("id", sectionId)
          .eq("site_id", siteId);
        return !error && (count ?? 0) > 0;
      },
    };

    // One pre-edit snapshot per request (memoized): the first applied tool call
    // triggers it, every edit in the request shares it, and the UI's Undo simply
    // restores it. Taken through the USER-scoped client so snapshot_site's own
    // membership gate (is_tenant_member) applies.
    let undoVersionId: string | null | undefined;
    const beforeEdit = async () => {
      if (undoVersionId === undefined) {
        const { data } = await userClient.rpc("snapshot_site", {
          p_site_id: siteId,
          p_label: "Before AI edit",
        });
        undoVersionId = (data as string | null) ?? null;
      }
      return undoVersionId;
    };

    const result = await runToolLoop({
      provider,
      callModel,
      history,
      prompt,
      loadSections: async () => {
        const { data } = await admin
          .from("sections")
          .select("id, type, content")
          .eq("site_id", siteId)
          .order("order");
        return (data ?? []) as SectionRecord[];
      },
      store,
      beforeEdit,
    });

    // Persist this turn's transcript with explicit, strictly increasing
    // timestamps — several rows land in one request, and created_at ties would
    // make reload order unstable.
    const base = Date.now();
    const rows = result.transcript.map((message, index) => ({
      session_id: sessionId,
      tenant_id: tenantId,
      role: message.role,
      content: message.content,
      created_at: new Date(base + index).toISOString(),
    }));
    const { error: persistError } = await admin.from("ai_messages").insert(rows);
    if (persistError) console.error("ai-command: failed to persist transcript", persistError);
    await admin
      .from("ai_sessions")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", sessionId);

    return json({
      ok: true,
      applied: result.applied,
      // Kept for pre-session clients, whose "did it apply" check is `ok && tool`.
      tool: result.edits[0]?.tool ?? null,
      session_id: sessionId,
      edits: result.edits,
      message: result.reply,
    });
  } catch (err) {
    console.error("ai-command error:", err);
    return json({ ok: false, message: "Something went wrong. Please try again." }, 500);
  }
});
