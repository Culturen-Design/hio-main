import { describe, expect, it } from "vitest";
import { type SiteTheme, parseSiteTheme, themeToStyle } from "./theme";

describe("parseSiteTheme", () => {
  it("keeps recognised fields", () => {
    expect(
      parseSiteTheme({
        accent: "#f0f",
        background: "#000",
        foreground: "#fff",
        font: "Inter",
        radius: "pill",
        style: "stone-slate",
      }),
    ).toEqual({
      accent: "#f0f",
      background: "#000",
      foreground: "#fff",
      font: "Inter",
      radius: "pill",
      style: "stone-slate",
    });
  });

  it("drops unknown and non-string fields", () => {
    expect(parseSiteTheme({ accent: "#f0f", weight: 700, extra: { x: 1 } })).toEqual({
      accent: "#f0f",
      background: undefined,
      foreground: undefined,
      font: undefined,
      radius: undefined,
      style: undefined,
    });
  });

  it("drops an unrecognised radius preset", () => {
    expect(parseSiteTheme({ radius: "very-round" }).radius).toBeUndefined();
  });

  it("drops an unrecognised style", () => {
    expect(parseSiteTheme({ style: "cyberpunk" }).style).toBeUndefined();
  });

  it("accepts the warm-blueprint-brutalism style", () => {
    expect(parseSiteTheme({ style: "warm-blueprint-brutalism" }).style).toBe(
      "warm-blueprint-brutalism",
    );
  });

  it("accepts every curated margin pattern and drops anything else", () => {
    expect(parseSiteTheme({ marginPattern: "none" }).marginPattern).toBe("none");
    expect(parseSiteTheme({ marginPattern: "dot-grid" }).marginPattern).toBe("dot-grid");
    expect(parseSiteTheme({ marginPattern: "diagonal-hatch" }).marginPattern).toBe(
      "diagonal-hatch",
    );
    expect(parseSiteTheme({ marginPattern: "pinstripe" }).marginPattern).toBe("pinstripe");
    expect(parseSiteTheme({ marginPattern: "zebra" }).marginPattern).toBeUndefined();
    expect(parseSiteTheme({ marginPattern: 7 }).marginPattern).toBeUndefined();
  });

  it("degrades a non-object to an empty theme", () => {
    expect(parseSiteTheme(null)).toEqual({});
    expect(parseSiteTheme("nope")).toEqual({});
  });
});

describe("themeToStyle", () => {
  it("maps set fields to inline styles + the accent/radius custom properties", () => {
    const theme: SiteTheme = {
      accent: "#2563eb",
      background: "#000",
      foreground: "#fff",
      font: "Inter",
      radius: "pill",
    };
    expect(themeToStyle(theme)).toEqual({
      background: "#000",
      color: "#fff",
      fontFamily: "Inter",
      "--site-accent": "#2563eb",
      "--color-primary": "#2563eb",
      "--color-primary-foreground": "#ffffff",
      "--radius-card": "9999px",
    });
  });

  it("falls back to a white accent foreground for an uncurated accent value", () => {
    expect(themeToStyle({ accent: "#abcdef" })).toMatchObject({
      "--color-primary-foreground": "#ffffff",
    });
  });

  it("omits unset fields (empty theme → empty style)", () => {
    expect(themeToStyle({})).toEqual({});
  });
});
