import { describe, expect, it } from "vitest";
import { credentialsSchema } from "./validation";

describe("credentialsSchema", () => {
  it("accepts a valid email + password", () => {
    const r = credentialsSchema.safeParse({ email: "staff@agency.com", password: "supersecret" });
    expect(r.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const r = credentialsSchema.safeParse({ email: "not-an-email", password: "supersecret" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/valid email/i);
  });

  it("rejects a short password", () => {
    const r = credentialsSchema.safeParse({ email: "staff@agency.com", password: "short" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/at least 8/i);
  });
});
