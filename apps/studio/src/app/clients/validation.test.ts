import { describe, expect, it } from "vitest";
import { SCHEMA_VARIANTS, newClientSchema, updateClientSchema } from "./validation";

describe("SCHEMA_VARIANTS", () => {
  it("is derived from the content-model bundles (includes self-serve)", () => {
    expect(SCHEMA_VARIANTS).toContain("self-serve");
  });
});

describe("newClientSchema", () => {
  it("accepts a valid client", () => {
    const r = newClientSchema.safeParse({
      name: "Acme Co",
      slug: "acme-co",
      schema_variant: "self-serve",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid slug (uppercase / spaces)", () => {
    const r = newClientSchema.safeParse({
      name: "Acme Co",
      slug: "Acme Co",
      schema_variant: "self-serve",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/lowercase/i);
  });

  it("rejects an unknown schema_variant", () => {
    const r = newClientSchema.safeParse({
      name: "Acme Co",
      slug: "acme-co",
      schema_variant: "does-not-exist",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const r = newClientSchema.safeParse({
      name: "  ",
      slug: "acme-co",
      schema_variant: "self-serve",
    });
    expect(r.success).toBe(false);
  });
});

describe("updateClientSchema", () => {
  it("requires a uuid id", () => {
    const r = updateClientSchema.safeParse({
      id: "not-a-uuid",
      name: "Acme",
      schema_variant: "self-serve",
    });
    expect(r.success).toBe(false);
  });
});
