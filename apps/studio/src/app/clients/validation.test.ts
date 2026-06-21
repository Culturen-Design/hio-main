import { describe, expect, it } from "vitest";
import {
  SCHEMA_VARIANTS,
  newClientSchema,
  updateClientSchema,
  updateCustomDomainSchema,
} from "./validation";

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

describe("updateCustomDomainSchema", () => {
  const id = "11111111-1111-1111-1111-111111111111";

  it("accepts a valid domain and lowercases it", () => {
    const r = updateCustomDomainSchema.safeParse({ id, custom_domain: "Acme.COM" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.custom_domain).toBe("acme.com");
  });

  it("accepts a subdomain", () => {
    const r = updateCustomDomainSchema.safeParse({ id, custom_domain: "www.acme.co.uk" });
    expect(r.success).toBe(true);
  });

  it("maps an empty string to null (clears the mapping)", () => {
    const r = updateCustomDomainSchema.safeParse({ id, custom_domain: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.custom_domain).toBeNull();
  });

  it("rejects a value with scheme or path", () => {
    expect(
      updateCustomDomainSchema.safeParse({ id, custom_domain: "https://acme.com" }).success,
    ).toBe(false);
    expect(updateCustomDomainSchema.safeParse({ id, custom_domain: "acme.com/path" }).success).toBe(
      false,
    );
  });

  it("rejects junk and bare labels", () => {
    expect(updateCustomDomainSchema.safeParse({ id, custom_domain: "not a domain" }).success).toBe(
      false,
    );
    expect(updateCustomDomainSchema.safeParse({ id, custom_domain: "localhost" }).success).toBe(
      false,
    );
  });

  it("requires a uuid id", () => {
    expect(
      updateCustomDomainSchema.safeParse({ id: "nope", custom_domain: "acme.com" }).success,
    ).toBe(false);
  });
});
