import { describe, expect, it } from "vitest";
import { isAppHost, normalizeHost } from "./hosts";

describe("normalizeHost", () => {
  it("lowercases and strips the port", () => {
    expect(normalizeHost("Acme.COM:3001")).toBe("acme.com");
  });

  it("handles bracketed IPv6 with a port", () => {
    expect(normalizeHost("[::1]:3000")).toBe("[::1]");
  });

  it("strips a trailing dot", () => {
    expect(normalizeHost("acme.com.")).toBe("acme.com");
  });

  it("returns empty string for null/undefined", () => {
    expect(normalizeHost(null)).toBe("");
    expect(normalizeHost(undefined)).toBe("");
  });
});

describe("isAppHost", () => {
  it("treats localhost (with or without port) as an app host", () => {
    expect(isAppHost("localhost")).toBe(true);
    expect(isAppHost("localhost:3001")).toBe(true);
    expect(isAppHost("127.0.0.1:3001")).toBe(true);
    expect(isAppHost("[::1]:3000")).toBe(true);
  });

  it("treats Netlify subdomains as app hosts", () => {
    expect(isAppHost("hio-studio.netlify.app")).toBe(true);
    expect(isAppHost("deploy-preview-21--hio-studio.netlify.app")).toBe(true);
  });

  it("treats an unknown host as a custom domain", () => {
    expect(isAppHost("acme.com")).toBe(false);
    expect(isAppHost("www.acme.com")).toBe(false);
  });

  it("honors the configured app-host allowlist (case/port-insensitive)", () => {
    expect(isAppHost("studio.agency.com", ["studio.agency.com"])).toBe(true);
    expect(isAppHost("Studio.Agency.com:443", ["studio.agency.com"])).toBe(true);
    expect(isAppHost("acme.com", ["studio.agency.com"])).toBe(false);
  });

  it("defaults an empty/unknown host to an app host (don't hijack)", () => {
    expect(isAppHost("")).toBe(true);
    expect(isAppHost(null)).toBe(true);
  });
});
