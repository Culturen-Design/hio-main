import { selfServeSchema } from "@hio/content-model";
import { describe, expect, it } from "vitest";
import {
  ADD_SECTION_TOOL,
  PROTECTED_FIELDS,
  REMOVE_SECTION_TOOL,
  type SectionRecord,
  type SectionStore,
  UPDATE_CONTENT_TOOL,
  buildClaudeTools,
  buildSchemaContext,
  executeTool,
  validateToolInput,
} from "./index";

/** In-memory SectionStore that records writes, so we can assert on persistence. */
function fakeStore(
  sections: SectionRecord[],
  opts: { fail?: boolean } = {},
): SectionStore & { inserted: Array<{ type: string; content: Record<string, unknown> }> } {
  const inserted: Array<{ type: string; content: Record<string, unknown> }> = [];
  return {
    inserted,
    async updateContent(id, content) {
      if (opts.fail) return false;
      const s = sections.find((x) => x.id === id);
      if (s) s.content = content;
      return true;
    },
    async insertSection(type, content) {
      if (opts.fail) return false;
      inserted.push({ type, content });
      return true;
    },
    async deleteSection(id) {
      if (opts.fail) return false;
      const idx = sections.findIndex((x) => x.id === id);
      if (idx === -1) return false;
      sections.splice(idx, 1);
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
  it("includes the built-in tools plus every provider tool, all with object schemas", () => {
    const tools = buildClaudeTools(selfServeSchema);
    const names = tools.map((t) => t.name);

    expect(names[0]).toBe(UPDATE_CONTENT_TOOL);
    expect(names).toContain(ADD_SECTION_TOOL);
    expect(names).toContain(REMOVE_SECTION_TOOL);
    expect(names).toContain("add_link");
    expect(names).toContain("remove_link");
    // Three built-ins + the provider's declared tools.
    expect(tools).toHaveLength(3 + selfServeSchema.allTools().length);

    for (const t of tools) {
      expect(t.input_schema.type).toBe("object");
      expect(t.description.length).toBeGreaterThan(0);
    }
  });

  it("types add_section against the ACTIVE provider's module set", () => {
    const addSection = buildClaudeTools(selfServeSchema).find((t) => t.name === ADD_SECTION_TOOL);
    const props = (addSection?.input_schema.properties ?? {}) as Record<
      string,
      { enum?: string[] }
    >;
    expect(props.type?.enum).toEqual(selfServeSchema.modules.map((m) => m.type));
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

describe("executeTool — calendar (proves the engine generalizes to a 2nd module)", () => {
  const calendarSections = (): SectionRecord[] => [
    {
      id: "cal-1",
      type: "calendar",
      content: {
        title: "Events",
        events: [{ id: "e1", date: "2099-01-01", title: "Kickoff" }],
        show_past: false,
      },
    },
  ];

  it("adds an event with a generated id (appendItem on a different field)", async () => {
    const sections = calendarSections();
    const r = await executeTool(
      selfServeSchema,
      "add_event",
      { section_id: "cal-1", event: { date: "2099-02-02", title: "Launch" } },
      sections,
      fakeStore(sections),
      seq("e2"),
    );
    expect(r.ok).toBe(true);
    const events = (sections[0]?.content as { events: { id: string; title: string }[] }).events;
    expect(events).toHaveLength(2);
    expect(events[1]).toEqual({ id: "e2", date: "2099-02-02", title: "Launch" });
  });

  it("updates an existing event by id (updateItem op)", async () => {
    const sections = calendarSections();
    const r = await executeTool(
      selfServeSchema,
      "update_event",
      { section_id: "cal-1", event_id: "e1", updates: { title: "Kickoff (moved)" } },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(true);
    const events = (sections[0]?.content as { events: { id: string; title: string }[] }).events;
    expect(events[0]).toEqual({ id: "e1", date: "2099-01-01", title: "Kickoff (moved)" });
  });

  it("rejects a non-ISO date server-side (schema validation)", async () => {
    const sections = calendarSections();
    const r = await executeTool(
      selfServeSchema,
      "add_event",
      { section_id: "cal-1", event: { date: "next friday", title: "Bad" } },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(false);
  });
});

describe("executeTool — add_section / remove_section (built-in section CRUD)", () => {
  it("adds a fully populated section: merges over defaults, assigns item ids, persists", async () => {
    const sections = freshSections();
    const store = fakeStore(sections);
    const r = await executeTool(
      selfServeSchema,
      ADD_SECTION_TOOL,
      {
        type: "services",
        content: {
          title: "What I offer",
          intro: "Hands-on help.",
          columns: 2,
          items: [
            { name: "Wheel throwing", price: "€40", icon: "🏺" },
            { name: "Glazing", description: "Colour matching." },
          ],
        },
      },
      sections,
      store,
      seq("s1", "s2"),
    );
    expect(r.ok).toBe(true);
    expect(store.inserted).toHaveLength(1);
    const inserted = store.inserted[0];
    expect(inserted?.type).toBe("services");
    const items = inserted?.content.items as Array<{ id: string; name: string }>;
    expect(items.map((i) => i.id)).toEqual(["s1", "s2"]);
    expect(inserted?.content.columns).toBe(2);
  });

  it("rejects a module type the provider does not carry", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      ADD_SECTION_TOOL,
      { type: "not-a-module", content: {} },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/isn't available/i);
  });

  it("rejects content that violates the module schema", async () => {
    const sections = freshSections();
    const r = await executeTool(
      selfServeSchema,
      ADD_SECTION_TOOL,
      { type: "hero", content: { headline: "x".repeat(200) } },
      sections,
      fakeStore(sections),
    );
    expect(r.ok).toBe(false);
  });

  it("reports 'not supported' when the store lacks insertSection (older stores keep working)", async () => {
    const sections = freshSections();
    const legacyStore: SectionStore = {
      async updateContent() {
        return true;
      },
    };
    const r = await executeTool(
      selfServeSchema,
      ADD_SECTION_TOOL,
      { type: "hero", content: { headline: "Hi" } },
      sections,
      legacyStore,
    );
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/isn't supported/i);
  });

  it("removes an existing section and reports a missing one", async () => {
    const sections = freshSections();
    const store = fakeStore(sections);
    const ok = await executeTool(
      selfServeSchema,
      REMOVE_SECTION_TOOL,
      { section_id: "bio-1" },
      sections,
      store,
    );
    expect(ok.ok).toBe(true);
    expect(sections.map((s) => s.id)).toEqual(["hero-1", "links-1"]);

    const missing = await executeTool(
      selfServeSchema,
      REMOVE_SECTION_TOOL,
      { section_id: "ghost" },
      sections,
      store,
    );
    expect(missing.ok).toBe(false);
    expect(missing.message).toMatch(/not found/i);
  });
});

describe("buildSchemaContext", () => {
  it("renders every enabled module type with its content schema (optional fields included)", () => {
    const ctx = buildSchemaContext(selfServeSchema);
    for (const m of selfServeSchema.modules) {
      expect(ctx).toContain(`- ${m.type} (`);
    }
    // An optional v1.6.0 field the page context alone would never reveal.
    expect(ctx).toContain("supporting_text");
    expect(ctx).toContain("image_url");
  });
});

describe("PROTECTED_FIELDS", () => {
  it("guards identity, layout, and style fields", () => {
    expect(PROTECTED_FIELDS).toContain("type");
    expect(PROTECTED_FIELDS).toContain("style_variant");
    expect(PROTECTED_FIELDS).toContain("id");
    // Tenancy keys are identity columns the AI must never write into content.
    expect(PROTECTED_FIELDS).toContain("tenant_id");
    expect(PROTECTED_FIELDS).toContain("site_id");
    // page_id was removed with the legacy schema (CONTRACT phase).
    expect(PROTECTED_FIELDS).not.toContain("page_id");
  });
});
