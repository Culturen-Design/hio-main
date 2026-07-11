import { describe, expect, it } from "vitest";
import { toastFromResult } from "./toastResult";

describe("toastFromResult", () => {
  it("turns { error } into an error toast carrying the server's message", () => {
    expect(toastFromResult({ error: "Not allowed" }, "Saved")).toEqual({
      kind: "error",
      message: "Not allowed",
    });
  });

  it("turns { ok: true } into a success toast with the caller's message", () => {
    expect(toastFromResult({ ok: true }, "Saved")).toEqual({ kind: "success", message: "Saved" });
  });

  it("treats any non-error object as success (e.g. auth's { message })", () => {
    expect(toastFromResult({ message: "Check your email" }, "Done")?.kind).toBe("success");
  });

  it("yields no toast for useActionState's initial null/undefined", () => {
    expect(toastFromResult(null, "Saved")).toBeNull();
    expect(toastFromResult(undefined, "Saved")).toBeNull();
  });

  it("ignores a non-string error property rather than toasting garbage", () => {
    expect(toastFromResult({ error: 42 } as Record<string, unknown>, "Saved")?.kind).toBe(
      "success",
    );
  });
});
