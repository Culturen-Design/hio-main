import { describe, expect, it } from "vitest";
import { friendlyAuthError, loginNotice, maskEmail, safeNext } from "./messages";

describe("friendlyAuthError", () => {
  it("maps known Supabase codes to plain text", () => {
    expect(friendlyAuthError({ code: "invalid_credentials" }, "login").error).toMatch(
      /don't match/,
    );
    expect(friendlyAuthError({ code: "same_password" }, "update").error).toMatch(
      /current password/,
    );
  });

  it("flags an unconfirmed email so the screen can offer Resend", () => {
    expect(friendlyAuthError({ code: "email_not_confirmed" }, "login")).toMatchObject({
      unconfirmed: true,
    });
  });

  it("treats any 429 as rate limiting", () => {
    expect(friendlyAuthError({ code: "something_new", status: 429 }, "signup").error).toMatch(
      /Too many attempts/,
    );
  });

  it("falls back to a message for the step, never Supabase's raw text", () => {
    expect(friendlyAuthError({ code: "unexpected_failure" }, "reset").error).toMatch(/reset email/);
    expect(friendlyAuthError(null, "signup").error).toMatch(/create your account/);
  });

  it("never says whether an account exists", () => {
    for (const code of ["user_already_exists", "email_exists", "user_not_found"]) {
      const { error } = friendlyAuthError({ code }, "signup");
      expect(error).not.toMatch(/already|exists|no account/i);
    }
  });
});

describe("safeNext", () => {
  it("keeps our own paths", () => {
    expect(safeNext("/reset-password")).toBe("/reset-password");
    expect(safeNext("/dashboard?welcome=1")).toBe("/dashboard?welcome=1");
  });

  it("refuses anything that could leave the site", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "evil",
      7,
      null,
    ]) {
      expect(safeNext(bad)).toBe("/dashboard");
    }
  });
});

describe("loginNotice", () => {
  it("knows its notices and ignores anything else", () => {
    expect(loginNotice("password-updated")?.tone).toBe("success");
    expect(loginNotice("<script>")).toBeNull();
    expect(loginNotice(undefined)).toBeNull();
  });
});

describe("maskEmail", () => {
  it("shows the start of the name and the domain", () => {
    expect(maskEmail("primallift@gmail.com")).toBe("pr••••••@gmail.com");
    expect(maskEmail("a@b.co")).toBe("a•@b.co");
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
});
