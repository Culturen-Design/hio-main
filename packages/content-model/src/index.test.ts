import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  type AiToolDescriptor,
  MODULE_BUNDLES,
  type ModuleDefinition,
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

  it("throws on a closed-union type that has no registered definition yet", () => {
    // `gallery` is a valid ModuleType but not yet built (absent from MODULE_REGISTRY).
    expect(() => resolveProvider("client-y", ["hero", "gallery"])).toThrow(
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
