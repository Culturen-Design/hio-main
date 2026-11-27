import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  type SiteTheme,
  curatedTheme,
  parseSiteTheme,
  sitePageProps,
  themeToStyle,
} from "./theme";

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
      radius: "round",
      style: "stone-slate",
    });
  });

  it("reads the old 'pill' rounding as 'round'", () => {
    expect(parseSiteTheme({ radius: "pill" }).radius).toBe("round");
  });

  it("keeps a curated page width and paper, drops anything else", () => {
    expect(parseSiteTheme({ pageWidth: "full", paper: "warm" })).toMatchObject({
      pageWidth: "full",
      paper: "warm",
    });
    expect(parseSiteTheme({ pageWidth: "huge", paper: "#000" })).toMatchObject({
      pageWidth: undefined,
      paper: undefined,
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
      radius: "round",
    };
    expect(themeToStyle(theme)).toEqual({
      background: "#000",
      color: "#fff",
      fontFamily: "Inter",
      "--site-accent": "#2563eb",
      "--color-primary": "#2563eb",
      "--color-primary-foreground": "#ffffff",
      "--radius-card": "14px",
      "--site-radius": "14px",
      "--site-radius-button": "9999px",
    });
  });

  it("sets the paper colour token from a paper preset, and nothing for the default", () => {
    expect(themeToStyle({ paper: "white" })).toEqual({ "--color-background": "#ffffff" });
    expect(themeToStyle({ paper: "default" })).toEqual({});
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

describe("sitePageProps", () => {
  it("gives a stored-before-this-change theme the classic width and defaults", () => {
    expect(sitePageProps({}).className).toBe(
      "site-public site-style-warm-blueprint-brutalism site-margin-none site-width-classic",
    );
  });

  it("adds one class per dimension and the inline tokens", () => {
    const p = sitePageProps({ style: "stone-slate", pageWidth: "wide", radius: "sharp" });
    expect(p.className).toContain("site-style-stone-slate");
    expect(p.className).toContain("site-width-wide");
    expect(p.style).toMatchObject({ "--site-radius": "0px" });
  });
});

describe("curatedTheme", () => {
  it("keeps curated values and replaces anything else with the default", () => {
    const t = curatedTheme({
      accent: "#2563eb",
      font: "Comic Sans",
      radius: "pill",
      style: "stone-slate",
      pageWidth: "narrow",
      paper: "javascript:alert(1)",
    });
    expect(t).toMatchObject({
      accent: "#2563eb",
      font: DEFAULT_THEME.font,
      radius: "round",
      style: "stone-slate",
      pageWidth: "narrow",
      paper: "default",
    });
  });

  it("resolves garbage to the full default theme", () => {
    expect(curatedTheme(null)).toEqual(DEFAULT_THEME);
  });
});
