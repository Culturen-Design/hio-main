import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  type AiToolDescriptor,
  MODULE_BUNDLES,
  MODULE_REGISTRY,
  type ModuleDefinition,
  type ModuleType,
  RESERVED_TOOL_NAMES,
  createSchemaProvider,
  defaultContentFor,
  heroModule,
  resolveProvider,
  resolveVariant,
  selfServeSchema,
} from "./index";

/** A throwaway module used to probe provider invariants without touching the
 *  built-in Self-Serve schema. */
function fakeModule(over: Partial<ModuleDefinition> = {}): ModuleDefinition {
  return {
    type: "custom",
    label: "Custom",
    contentSchema: z.object({ text: z.string() }),
    defaults: { text: "" },
    width: [12, 12],
    aiTools: [],
    ...over,
  };
}

function tool(name: string): AiToolDescriptor {
  return {
    name,
    description: "x",
    moduleType: "custom",
    inputSchema: z.object({ section_id: z.string() }),
    op: { kind: "removeItem", field: "items", idKey: "id" },
  };
}

describe("createSchemaProvider — seam invariants", () => {
  it("builds a provider and flattens tools across modules", () => {
    const p = createSchemaProvider("p", [
      fakeModule({ type: "hero", aiTools: [tool("a")] }),
      fakeModule({ type: "bio", aiTools: [tool("b")] }),
    ]);
    expect(p.id).toBe("p");
    expect(p.allTools().map((t) => t.name)).toEqual(["a", "b"]);
    expect(p.getModule("hero")?.type).toBe("hero");
    expect(p.getModule("links")).toBeUndefined();
  });

  it("rejects duplicate module types", () => {
    expect(() =>
      createSchemaProvider("dup", [fakeModule({ type: "hero" }), fakeModule({ type: "hero" })]),
    ).toThrow(/duplicate module type/i);
  });

  it("rejects duplicate AI tool names across modules", () => {
    expect(() =>
      createSchemaProvider("dup", [
        fakeModule({ type: "hero", aiTools: [tool("same")] }),
        fakeModule({ type: "bio", aiTools: [tool("same")] }),
      ]),
    ).toThrow(/duplicate ai tool name/i);
  });

  it("rejects a tool that shadows a reserved engine tool name", () => {
    expect(() =>
      createSchemaProvider("res", [
        fakeModule({ aiTools: [tool(RESERVED_TOOL_NAMES[0] as string)] }),
      ]),
    ).toThrow(/reserved engine tool name/i);
  });
});

describe("defaultContentFor", () => {
  it("resolves defaults from the built-in provider by default", () => {
    expect(defaultContentFor("hero")).toEqual(heroModule.defaults);
  });

  it("resolves defaults from an explicitly passed provider", () => {
    const p = createSchemaProvider("client-x", [
      fakeModule({ type: "bio", defaults: { text: "hi" } }),
    ]);
    expect(defaultContentFor("bio", p)).toEqual({ text: "hi" });
    // A type the passed provider does not carry falls back to {}.
    expect(defaultContentFor("hero", p)).toEqual({});
  });
});

describe("selfServeSchema", () => {
  it("is a valid provider (construction would have thrown on a collision)", () => {
    expect(selfServeSchema.id).toBe("self-serve");
    expect(selfServeSchema.modules.length).toBeGreaterThan(0);
  });

  it("is expressed via the registry/bundle (same module set as the self-serve bundle)", () => {
    expect(selfServeSchema.modules.map((m) => m.type)).toEqual(MODULE_BUNDLES["self-serve"]);
  });
});

describe("contact module (free-tier)", () => {
  it("is registered and resolvable, with sensible defaults", () => {
    const p = resolveProvider("p", ["contact"]);
    const mod = p.getModule("contact");
    expect(mod?.type).toBe("contact");
    // Defaults are valid against the module's own schema.
    expect(mod?.contentSchema.safeParse(mod.defaults).success).toBe(true);
    // Plain-text module: no declared collection tools (edited via update_module_content).
    expect(mod?.aiTools).toEqual([]);
  });

  it("is part of the self-serve bundle (free-tier surface)", () => {
    expect(MODULE_BUNDLES["self-serve"]).toContain("contact");
    expect(selfServeSchema.getModule("contact")?.type).toBe("contact");
  });
});

describe("services module (collection)", () => {
  it("is registered with add/update/remove tools and valid defaults", () => {
    const p = resolveProvider("p", ["services"]);
    const mod = p.getModule("services");
    expect(mod?.type).toBe("services");
    expect(mod?.contentSchema.safeParse(mod.defaults).success).toBe(true);
    const toolNames = p.allTools().map((t) => t.name);
    expect(toolNames).toEqual(
      expect.arrayContaining(["add_service", "update_service", "remove_service"]),
    );
  });

  it("is part of the self-serve bundle", () => {
    expect(MODULE_BUNDLES["self-serve"]).toContain("services");
    expect(selfServeSchema.getModule("services")?.type).toBe("services");
  });
});

describe("gallery + testimonial modules (collections)", () => {
  it("gallery is registered with add/update/remove image tools and valid defaults", () => {
    const p = resolveProvider("p", ["gallery"]);
    const mod = p.getModule("gallery");
    expect(mod?.type).toBe("gallery");
    expect(mod?.contentSchema.safeParse(mod.defaults).success).toBe(true);
    expect(p.allTools().map((t) => t.name)).toEqual(
      expect.arrayContaining(["add_image", "update_image", "remove_image"]),
    );
  });

  it("testimonial is registered with add/update/remove tools and valid defaults", () => {
    const p = resolveProvider("p", ["testimonial"]);
    const mod = p.getModule("testimonial");
    expect(mod?.type).toBe("testimonial");
    expect(mod?.contentSchema.safeParse(mod.defaults).success).toBe(true);
    expect(p.allTools().map((t) => t.name)).toEqual(
      expect.arrayContaining(["add_testimonial", "update_testimonial", "remove_testimonial"]),
    );
  });

  it("both are part of the self-serve bundle", () => {
    expect(MODULE_BUNDLES["self-serve"]).toEqual(
      expect.arrayContaining(["gallery", "testimonial"]),
    );
  });
});

describe("custom module (the escape hatch — last of 9 module types)", () => {
  it("is registered and resolvable, with sensible defaults", () => {
    const p = resolveProvider("p", ["custom"]);
    const mod = p.getModule("custom");
    expect(mod?.type).toBe("custom");
    expect(mod?.contentSchema.safeParse(mod.defaults).success).toBe(true);
    // Plain-text module (title + markdown body): no declared collection tools —
    // edited via the built-in update_module_content, same as contact/bio.
    expect(mod?.aiTools).toEqual([]);
  });

  it("rejects a body over the length cap", () => {
    const mod = MODULE_REGISTRY.custom;
    expect(mod?.contentSchema.safeParse({ title: "x", body: "a".repeat(5001) }).success).toBe(
      false,
    );
  });

  it("is part of the self-serve bundle", () => {
    expect(MODULE_BUNDLES["self-serve"]).toContain("custom");
    expect(selfServeSchema.getModule("custom")?.type).toBe("custom");
  });
});

describe("v1.6.0 content expansion — additive and backward compatible", () => {
  it("pre-expansion rows (no new fields) still validate for every module", () => {
    const legacyRows: Array<[ModuleType, Record<string, unknown>]> = [
      ["hero", { headline: "Hi" }],
      ["bio", { title: "About", body: "Text" }],
      ["links", { title: "Links", items: [], columns: 2 }],
      ["calendar", { title: "Events", events: [], show_past: false }],
      ["contact", { title: "Contact" }],
      ["services", { title: "Services", items: [{ id: "s1", name: "Cut" }] }],
      ["gallery", { title: "Gallery", images: [], columns: 3 }],
      ["testimonial", { title: "Quotes", items: [{ id: "t1", quote: "Nice", author: "Ann" }] }],
      ["custom", { title: "X", body: "y" }],
    ];
    for (const [type, row] of legacyRows) {
      const parsed = MODULE_REGISTRY[type]?.contentSchema.safeParse(row);
      expect(parsed?.success, type).toBe(true);
    }
  });

  it("accepts the new fields on each expanded module", () => {
    expect(
      MODULE_REGISTRY.hero?.contentSchema.safeParse({
        headline: "Hi",
        supporting_text: "More context.",
        image_url: "https://img.example.com/banner.jpg",
        image_alt: "Banner",
      }).success,
    ).toBe(true);
    expect(
      MODULE_REGISTRY.bio?.contentSchema.safeParse({
        title: "About",
        tagline: "Potter & teacher",
        body: "Text",
        facts: [{ id: "f1", label: "Experience", value: "12 years" }],
      }).success,
    ).toBe(true);
    expect(
      MODULE_REGISTRY.contact?.contentSchema.safeParse({
        title: "Contact",
        hours: "Tue–Sat 10–18",
        cta_label: "Book",
        cta_url: "https://cal.example.com",
      }).success,
    ).toBe(true);
    expect(
      MODULE_REGISTRY.services?.contentSchema.safeParse({
        title: "Services",
        intro: "What I offer.",
        columns: 2,
        items: [
          {
            id: "s1",
            name: "Wheel throwing",
            icon: "🏺",
            image_url: "https://img.example.com/s.jpg",
            image_alt: "Wheel",
            link_url: "https://example.com/book",
            link_label: "Book now",
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      MODULE_REGISTRY.testimonial?.contentSchema.safeParse({
        title: "Quotes",
        intro: "Kind words.",
        items: [{ id: "t1", quote: "Nice", author: "Ann", rating: 5 }],
      }).success,
    ).toBe(true);
  });

  it("rejects out-of-range values on the new fields", () => {
    expect(
      MODULE_REGISTRY.testimonial?.contentSchema.safeParse({
        title: "Q",
        items: [{ id: "t1", quote: "Nice", author: "Ann", rating: 6 }],
      }).success,
    ).toBe(false);
    expect(
      MODULE_REGISTRY.services?.contentSchema.safeParse({
        title: "S",
        items: [],
        columns: 4,
      }).success,
    ).toBe(false);
    expect(
      MODULE_REGISTRY.hero?.contentSchema.safeParse({
        headline: "Hi",
        image_url: "not-a-url",
      }).success,
    ).toBe(false);
  });

  it("bio gained its quick-facts collection tools", () => {
    const toolNames = selfServeSchema.allTools().map((t) => t.name);
    expect(toolNames).toEqual(expect.arrayContaining(["add_fact", "update_fact", "remove_fact"]));
  });
});

describe("resolveProvider — per-tenant provider from an enabled module set", () => {
  it("exposes ONLY the enabled modules and their tools (toolset = enabled set)", () => {
    // A studio-style tenant that enables links but NOT calendar.
    const p = resolveProvider("client-acme", ["hero", "links"]);
    expect(p.modules.map((m) => m.type)).toEqual(["hero", "links"]);
    const toolNames = p.allTools().map((t) => t.name);
    // links' tools are present...
    expect(toolNames).toContain("add_link");
    expect(toolNames).toContain("remove_link");
    // ...calendar was not enabled, so its tools do NOT leak in.
    expect(toolNames).not.toContain("add_event");
    expect(p.getModule("calendar")).toBeUndefined();
  });

  it("preserves the enabled-type order in the resolved module list", () => {
    const p = resolveProvider("client-x", ["links", "hero"]);
    expect(p.modules.map((m) => m.type)).toEqual(["links", "hero"]);
  });

  it("throws on a type with no registered definition (all 9 closed-union types are now built)", () => {
    // No real ModuleType is unregistered anymore, so force the error path with a
    // cast — this still proves resolveProvider fails loudly rather than silently.
    expect(() => resolveProvider("client-y", ["hero", "not-a-real-type" as ModuleType])).toThrow(
      /not registered in MODULE_REGISTRY/i,
    );
  });

  it("inherits createSchemaProvider invariants (duplicate enabled types rejected)", () => {
    expect(() => resolveProvider("client-z", ["hero", "hero"])).toThrow(/duplicate module type/i);
  });
});

describe("resolveVariant — provider from a tenant's schema_variant", () => {
  it("resolves the self-serve variant to the self-serve bundle's modules", () => {
    const p = resolveVariant("tenant-1", "self-serve");
    expect(p.modules.map((m) => m.type)).toEqual(MODULE_BUNDLES["self-serve"]);
  });

  it("throws on an unknown schema_variant rather than serving an empty toolset", () => {
    expect(() => resolveVariant("tenant-2", "does-not-exist")).toThrow(/unknown schema_variant/i);
  });
});
