/**
 * Seam-freeze contract test (M3 gate).
 *
 * The freeze guarantee is: the engine is driven ENTIRELY by the active
 * `SchemaProvider`. Swapping the provider must change the available AI tools and
 * their behaviour with ZERO change to engine code. This test pins that by
 * building a synthetic provider that the built-in Self-Serve schema knows nothing
 * about, then asserting the same engine functions generate, validate, and execute
 * its tools. If this breaks, Studio's per-client providers break too.
 */
import {
  type ModuleDefinition,
  type SchemaProvider,
  createSchemaProvider,
  selfServeSchema,
} from "@hio/content-model";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  type SectionRecord,
  type SectionStore,
  UPDATE_CONTENT_TOOL,
  buildClaudeTools,
  executeTool,
  validateToolInput,
} from "./index";

/** A provider the engine has never seen: a "gallery" module (a valid closed-union
 *  type that Self-Serve does NOT register) with a bespoke collection tool. Stands
 *  in for a Studio per-client provider. */
const photoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  caption: z.string().optional(),
});
const galleryModule: ModuleDefinition = {
  type: "gallery",
  label: "Gallery",
  contentSchema: z.object({ title: z.string(), photos: z.array(photoSchema) }),
  defaults: { title: "Gallery", photos: [] },
  width: [6, 12],
  aiTools: [
    {
      name: "add_photo",
      description: "Adds a photo to the gallery.",
      moduleType: "gallery",
      inputSchema: z.object({ section_id: z.string(), photo: photoSchema.omit({ id: true }) }),
      op: { kind: "appendItem", field: "photos", itemKey: "photo", genId: true },
    },
  ],
};
const clientProvider: SchemaProvider = createSchemaProvider("client-acme", [galleryModule]);

function fakeStore(sections: SectionRecord[]): SectionStore {
  return {
    async updateContent(id, content) {
      const s = sections.find((x) => x.id === id);
      if (s) s.content = content;
      return true;
    },
  };
}

describe("seam freeze — swapping the provider changes the toolset, not the engine", () => {
  it("generates the new provider's tool and drops the old provider's tools", () => {
    const names = buildClaudeTools(clientProvider).map((t) => t.name);
    // Built-in module-agnostic tool is always present.
    expect(names).toContain(UPDATE_CONTENT_TOOL);
    // The client provider's bespoke tool appears...
    expect(names).toContain("add_photo");
    // ...and Self-Serve's tools do NOT leak across the seam.
    expect(names).not.toContain("add_link");
    expect(names).not.toContain("add_event");
  });

  it("the SAME engine functions also serve the Self-Serve provider (no per-product code)", () => {
    expect(buildClaudeTools(selfServeSchema).map((t) => t.name)).toContain("add_link");
    expect(buildClaudeTools(clientProvider).map((t) => t.name)).toContain("add_photo");
  });

  it("executes the new provider's collection op end-to-end", async () => {
    const sections: SectionRecord[] = [
      { id: "g1", type: "gallery", content: { title: "Gallery", photos: [] } },
    ];
    const r = await executeTool(
      clientProvider,
      "add_photo",
      { section_id: "g1", photo: { url: "https://cdn.test/a.jpg", caption: "A" } },
      sections,
      fakeStore(sections),
      () => "photo-1",
    );
    expect(r.ok).toBe(true);
    const photos = (sections[0]?.content as { photos: { id: string; url: string }[] }).photos;
    expect(photos).toEqual([{ id: "photo-1", url: "https://cdn.test/a.jpg", caption: "A" }]);
  });

  it("validates the new provider's tool input server-side (bad URL rejected)", () => {
    const r = validateToolInput(clientProvider, "add_photo", {
      section_id: "g1",
      photo: { url: "not-a-url" },
    });
    expect(r.ok).toBe(false);
  });

  it("rejects post-mutation content that violates the module schema", async () => {
    const sections: SectionRecord[] = [
      { id: "g1", type: "gallery", content: { title: "Gallery", photos: [] } },
    ];
    // update_module_content trying to set photos to a non-array → schema rejects.
    const r = await executeTool(
      clientProvider,
      UPDATE_CONTENT_TOOL,
      { section_id: "g1", updates: { photos: "oops" } },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(false);
  });
});
