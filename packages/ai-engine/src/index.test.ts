import { selfServeSchema } from "@hio/content-model";
import { describe, expect, it } from "vitest";
import {
  PROTECTED_FIELDS,
  type SectionRecord,
  type SectionStore,
  UPDATE_CONTENT_TOOL,
  buildClaudeTools,
  executeTool,
  validateToolInput,
} from "./index";

/** In-memory SectionStore that records writes, so we can assert on persistence. */
function fakeStore(sections: SectionRecord[], opts: { fail?: boolean } = {}): SectionStore {
  return {
    async updateContent(id, content) {
      if (opts.fail) return false;
      const s = sections.find((x) => x.id === id);
      if (s) s.content = content;
      return true;
    },
  };
}

function freshSections(): SectionRecord[] {
  return [
    { id: "hero-1", type: "hero", content: { headline: "Hi", subheadline: "Old" } },
    { id: "bio-1", type: "bio", content: { title: "About", body: "Old bio" } },
    {
      id: "links-1",
      type: "links",
      content: {
        title: "Links",
        items: [{ id: "l1", title: "GitHub", url: "https://gh.com" }],
        columns: 2,
      },
    },
  ];
}

const seq = (...ids: string[]) => {
  let i = 0;
  return () => ids[i++] ?? "gen";
};

describe("buildClaudeTools", () => {
  it("includes the built-in update tool plus every provider tool, all with object schemas", () => {
    const tools = buildClaudeTools(selfServeSchema);
    const names = tools.map((t) => t.name);

    expect(names[0]).toBe(UPDATE_CONTENT_TOOL);
    expect(names).toContain("add_link");
    expect(names).toContain("remove_link");
    // One built-in + the provider's declared tools.
    expect(tools).toHaveLength(1 + selfServeSchema.allTools().length);

    for (const t of tools) {
      expect(t.input_schema.type).toBe("object");
      expect(t.description.length).toBeGreaterThan(0);
    }
  });

  it("emits a real JSON Schema for a declared tool (no $schema, typed fields)", () => {
    const addLink = buildClaudeTools(selfServeSchema).find((t) => t.name === "add_link");
    expect(addLink).toBeDefined();
    expect(addLink?.input_schema).not.toHaveProperty("$schema");
    const props = (addLink?.input_schema.properties ?? {}) as Record<string, unknown>;
    expect(props).toHaveProperty("section_id");
    expect(props).toHaveProperty("link");
  });
});

describe("validateToolInput", () => {
  it("accepts a well-formed update and rejects unknown tools", () => {
    expect(
      validateToolInput(selfServeSchema, UPDATE_CONTENT_TOOL, {
        section_id: "x",
        updates: { headline: "New" },
      }).ok,
    ).toBe(true);
    expect(validateToolInput(selfServeSchema, "nope", {}).ok).toBe(false);
  });

  it("rejects a declared tool with a bad URL", () => {
    const r = validateToolInput(selfServeSchema, "add_link", {
      section_id: "links-1",
      link: { title: "x", url: "not-a-url" },
    });
    expect(r.ok).toBe(false);
  });
});

describe("executeTool — update_module_content", () => {
  it("merges valid partial updates and persists them", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      UPDATE_CONTENT_TOOL,
      { section_id: "hero-1", updates: { headline: "New headline" } },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(true);
    expect(sections[0]?.content).toEqual({ headline: "New headline", subheadline: "Old" });
  });

  it("refuses protected fields", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      UPDATE_CONTENT_TOOL,
      { section_id: "hero-1", updates: { type: "bio", headline: "x" } },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/protected/i);
    // Nothing persisted.
    expect(sections[0]?.content).toEqual({ headline: "Hi", subheadline: "Old" });
  });

  it("rejects content that violates the module schema", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      UPDATE_CONTENT_TOOL,
      { section_id: "hero-1", updates: { headline: "x".repeat(200) } },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(false);
  });

  it("reports a missing section", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      UPDATE_CONTENT_TOOL,
      { section_id: "ghost", updates: { headline: "x" } },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/not found/i);
  });

  it("surfaces a persistence failure", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      UPDATE_CONTENT_TOOL,
      { section_id: "hero-1", updates: { headline: "x" } },
      sections,
      fakeStore(sections, { fail: true }),
    );
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/failed/i);
  });
});

describe("executeTool — collection ops", () => {
  it("appends a link with a generated id", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      "add_link",
      { section_id: "links-1", link: { title: "Shop", url: "https://shop.com" } },
      sections,
      fakeStore(sections),
      seq("new-id"),
    );
    expect(r.ok).toBe(true);
    const items = (sections[2]?.content as { items: { id: string; title: string }[] }).items;
    expect(items).toHaveLength(2);
    expect(items[1]).toEqual({ id: "new-id", title: "Shop", url: "https://shop.com" });
  });

  it("removes a link by id", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      "remove_link",
      { section_id: "links-1", link_id: "l1" },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(true);
    expect((sections[2]?.content as { items: unknown[] }).items).toHaveLength(0);
  });

  it("reports when the target item does not exist", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      "remove_link",
      { section_id: "links-1", link_id: "missing" },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/not found/i);
  });
});

describe("PROTECTED_FIELDS", () => {
  it("guards identity, layout, and style fields", () => {
    expect(PROTECTED_FIELDS).toContain("type");
    expect(PROTECTED_FIELDS).toContain("style_variant");
    expect(PROTECTED_FIELDS).toContain("id");
  });
});
