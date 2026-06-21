import { describe, expect, it } from "vitest";
import { type SiteTheme, parseSiteTheme, themeToStyle } from "./theme";

describe("parseSiteTheme", () => {
  it("keeps recognised string fields", () => {
    expect(
      parseSiteTheme({ accent: "#f0f", background: "#000", foreground: "#fff", font: "Inter" }),
    ).toEqual({
      accent: "#f0f",
      background: "#000",
      foreground: "#fff",
      font: "Inter",
    });
  });

  it("drops unknown and non-string fields", () => {
    expect(parseSiteTheme({ accent: "#f0f", weight: 700, extra: { x: 1 } })).toEqual({
      accent: "#f0f",
      background: undefined,
      foreground: undefined,
      font: undefined,
    });
  });

  it("degrades a non-object to an empty theme", () => {
    expect(parseSiteTheme(null)).toEqual({});
    expect(parseSiteTheme("nope")).toEqual({});
  });
});

describe("themeToStyle", () => {
  it("maps set fields to inline styles + the accent custom property", () => {
    const theme: SiteTheme = {
      accent: "#f0f",
      background: "#000",
      foreground: "#fff",
      font: "Inter",
    };
    expect(themeToStyle(theme)).toEqual({
      background: "#000",
      color: "#fff",
      fontFamily: "Inter",
      "--site-accent": "#f0f",
    });
  });

  it("omits unset fields (empty theme → empty style)", () => {
    expect(themeToStyle({})).toEqual({});
  });
});
