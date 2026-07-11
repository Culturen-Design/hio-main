"use client";

import { createClient } from "@/lib/supabase/client";
import type { Json } from "@hio/db";
import { parseSiteTheme, themeToStyle } from "@hio/ui";
import {
  BuilderCanvas,
  type BuilderSection,
  type SendOutcome,
  buildSuggestions,
  buttonClasses,
} from "@hio/ui/admin";
import { useRouter } from "next/navigation";
import { addModule, deleteSection, moveSection, updateContent } from "./actions";

type CommandResponse = { ok: boolean; message: string; tool?: string };

/**
 * Thin binding layer: the shared BuilderCanvas is Next-free, so this wrapper
 * owns the router, the Supabase client, and the app's server actions. The
 * `send` adapter calls the shared `ai-command` edge function (schema-driven by
 * @hio/ai-engine, which resolves the provider + membership-gates the edit).
 */
export function BuilderClient({
  tenantId,
  site,
  sections,
  palette,
  theme,
}: {
  tenantId: string;
  site: { id: string; slug: string };
  sections: BuilderSection[];
  palette: { type: string; label: string }[];
  theme?: unknown;
}) {
  const router = useRouter();

  async function send(prompt: string): Promise<SendOutcome> {
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke<CommandResponse>("ai-command", {
      body: { prompt, tenant_id: tenantId, site_id: site.id },
    });

    if (error) {
      // Non-2xx (e.g. 503 when ANTHROPIC_API_KEY isn't set) — only FunctionsHttpError
      // carries the Response in `context`; surface the body message when present.
      const res = (error as { context?: Response }).context;
      const body = res ? ((await res.json().catch(() => null)) as CommandResponse | null) : null;
      return {
        reply: body?.message ?? "AI chat is unavailable right now.",
        applied: false,
        failed: true,
      };
    }
    return { reply: data?.message ?? "Done.", applied: Boolean(data?.ok && data?.tool) };
  }

  return (
    <BuilderCanvas
      title="Builder"
      subtitle={
        <>
          Editing <code>/{site.slug}</code>
        </>
      }
      headerActions={
        <a
          href={`/${site.slug}`}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses("secondary", "sm")}
        >
          View public ↗
        </a>
      }
      sections={sections}
      palette={palette}
      canvasStyle={themeToStyle(parseSiteTheme(theme))}
      onAdd={addModule}
      onDelete={deleteSection}
      onMove={moveSection}
      onSaveContent={(sectionId, type, next) => updateContent(sectionId, type, next as Json)}
      chat={{
        send,
        onApplied: () => router.refresh(),
        intro:
          "Tell me what to change — e.g. “make the headline say Welcome”, “add a link to my shop”, or “add a testimonials section” (I'll fill it with sample content you can tweak). I can also remove a section if you ask.",
        storageKey: `hio-chat-${site.id}`,
        suggestions: buildSuggestions(
          sections,
          palette.map((p) => p.type),
        ),
      }}
    />
  );
}
