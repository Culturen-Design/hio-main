"use client";

import { createClient } from "@/lib/supabase/client";
import type { ModuleType } from "@hio/content-model";
import type { Json } from "@hio/db";
import {
  BuilderCanvas,
  type BuilderSection,
  type SendOutcome,
  buildSuggestions,
  buttonClasses,
} from "@hio/ui/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addSection, deleteSection, moveSection, updateSectionContent } from "./actions";

type CommandResponse = {
  ok: boolean;
  applied?: boolean;
  message: string;
  tool?: string | null;
  session_id?: string;
  edits?: { tool: string; sectionId: string | null; undoVersionId: string | null }[];
};

/**
 * Thin binding layer for the per-client builder: binds the Studio,
 * membership-gated server actions (all tenant-scoped) into the shared
 * BuilderCanvas. Same `ai-command` engine as Self-Serve; the function picks
 * the client's per-client provider by request shape. The conversation is
 * SERVER-OWNED — this client only remembers the session id (per tab) so
 * follow-up messages resume the same conversation.
 */
export function BuilderClient({
  tenantId,
  siteId,
  clientName,
  schemaVariant,
  sections,
  palette,
  paletteError,
}: {
  tenantId: string;
  siteId: string;
  clientName: string;
  schemaVariant: string;
  sections: BuilderSection[];
  palette: { type: string; label: string }[];
  paletteError: string | null;
}) {
  const router = useRouter();
  const sessionKey = `hio-chat-session-${siteId}`;

  async function send(prompt: string): Promise<SendOutcome> {
    const supabase = createClient();
    const sessionId =
      typeof window !== "undefined" ? window.sessionStorage.getItem(sessionKey) : null;
    const { data, error } = await supabase.functions.invoke<CommandResponse>("ai-command", {
      body: {
        prompt,
        tenant_id: tenantId,
        site_id: siteId,
        ...(sessionId ? { session_id: sessionId } : {}),
      },
    });

    if (error) {
      // Non-2xx — only FunctionsHttpError carries the Response in `context`;
      // surface the body message when present.
      const res = (error as { context?: Response }).context;
      const body = res ? ((await res.json().catch(() => null)) as CommandResponse | null) : null;
      return {
        reply: body?.message ?? "AI chat is unavailable right now.",
        applied: false,
        failed: true,
      };
    }
    if (data?.session_id && typeof window !== "undefined") {
      window.sessionStorage.setItem(sessionKey, data.session_id);
    }
    return {
      reply: data?.message ?? "Done.",
      applied: Boolean(data?.ok && (data?.applied ?? data?.tool)),
      undoVersionId: data?.edits?.[0]?.undoVersionId ?? null,
    };
  }

  // One-click revert to the pre-edit snapshot the function captured.
  // restore_site_version is SECURITY DEFINER + membership-gated, and snapshots
  // the current state first ("Before restore"), so the undo is itself undoable.
  async function onUndo(versionId: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc("restore_site_version", { p_version_id: versionId });
    if (error) return { ok: false, message: "Couldn't undo that change." };
    router.refresh();
    return { ok: true, message: "Reverted — the page is back to how it was before that edit." };
  }

  return (
    <BuilderCanvas
      title={clientName}
      subtitle={
        <>
          Builder · schema <code>{schemaVariant}</code>
        </>
      }
      headerActions={
        <Link href={`/clients/${tenantId}`} className={buttonClasses("secondary", "sm")}>
          ← Client
        </Link>
      }
      sections={sections}
      palette={palette}
      paletteError={paletteError}
      onAdd={(type: ModuleType, atIndex?: number) => addSection(tenantId, type, atIndex)}
      onDelete={(sectionId) => deleteSection(tenantId, sectionId)}
      onMove={(sectionId, toIndex) => moveSection(tenantId, sectionId, toIndex)}
      onSaveContent={(sectionId, type, next) =>
        updateSectionContent(tenantId, sectionId, type, next as Json)
      }
      chat={{
        send,
        onApplied: () => router.refresh(),
        onUndo,
        intro:
          "Tell me what to change — e.g. “make the headline say Welcome to Acme” or “add a services section” (it arrives fully populated with sample content). I can also remove a section on request.",
        storageKey: `hio-chat-${siteId}`,
        suggestions: buildSuggestions(
          sections,
          palette.map((p) => p.type),
        ),
      }}
    />
  );
}
