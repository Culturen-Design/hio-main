import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  type AiToolDescriptor,
  type ModuleDefinition,
  RESERVED_TOOL_NAMES,
  createSchemaProvider,
  defaultContentFor,
  heroModule,
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
});
