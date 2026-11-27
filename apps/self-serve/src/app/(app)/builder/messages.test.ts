import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { friendlyError, invalidContentMessage } from "./messages";

describe("friendlyError", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it("never shows the raw database message", () => {
    const msg = friendlyError("save", {
      message: 'new row violates row-level security policy for table "sections"',
    });
    expect(msg).toBe("Couldn't save your changes. Please try again in a moment.");
    expect(msg).not.toMatch(/sections|policy/);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("explains a permission refusal", () => {
    expect(friendlyError("add", { code: "42501", message: "x" })).toBe(
      "You can't add that section on your current plan or account status.",
    );
  });
});

describe("invalidContentMessage", () => {
  it("names the failing field in plain words", () => {
    const schema = z.object({ cta_url: z.string().url() });
    const r = schema.safeParse({ cta_url: "nope" });
    if (r.success) throw new Error("expected failure");
    expect(invalidContentMessage(r.error)).toBe("Please check “cta url”: invalid url.");
  });
});
