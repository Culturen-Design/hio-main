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

type CommandResponse = { ok: boolean; message: string; tool?: string };

/**
 * Thin binding layer for the per-client builder: binds the Studio,
 * membership-gated server actions (all tenant-scoped) into the shared
 * BuilderCanvas. Same `ai-command` engine as Self-Serve; the function picks
 * the client's per-client provider by request shape.
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

  async function send(prompt: string): Promise<SendOutcome> {
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke<CommandResponse>("ai-command", {
      body: { prompt, tenant_id: tenantId, site_id: siteId },
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
    return { reply: data?.message ?? "Done.", applied: Boolean(data?.ok && data?.tool) };
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
      // Studio has no AdminShell until PR 4, so the builder owns the full viewport.
      heightClassName="lg:h-dvh"
      onAdd={(type: ModuleType) => addSection(tenantId, type)}
      onDelete={(sectionId) => deleteSection(tenantId, sectionId)}
      onMove={(sectionId, toIndex) => moveSection(tenantId, sectionId, toIndex)}
      onSaveContent={(sectionId, type, next) =>
        updateSectionContent(tenantId, sectionId, type, next as Json)
      }
      chat={{
        send,
        onApplied: () => router.refresh(),
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
