import { describe, expect, it } from "vitest";
import { updateThemeSchema } from "./validation";

describe("updateThemeSchema", () => {
  it("accepts a curated accent/font/radius combination", () => {
    const r = updateThemeSchema.safeParse({
      accent: "#2563eb",
      font: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      radius: "round",
      style: "warm-blueprint-brutalism",
      marginPattern: "dot-grid",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an unrecognised margin pattern", () => {
    const r = updateThemeSchema.safeParse({
      accent: "#2563eb",
      font: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      radius: "soft",
      style: "warm-blueprint-brutalism",
      marginPattern: "zebra",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an accent value outside the curated swatches (no free color picker)", () => {
    const r = updateThemeSchema.safeParse({
      accent: "#123456",
      font: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      radius: "soft",
      style: "stone-slate",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a font not on the curated list", () => {
    const r = updateThemeSchema.safeParse({
      accent: "#2563eb",
      font: "Comic Sans MS",
      radius: "soft",
      style: "stone-slate",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an unrecognised radius preset", () => {
    const r = updateThemeSchema.safeParse({
      accent: "#2563eb",
      font: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      radius: "very-round",
      style: "stone-slate",
    });
    expect(r.success).toBe(false);
  });

  it("defaults the page width and paper for an older client, and checks them", () => {
    const base = {
      accent: "#2563eb",
      font: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      radius: "soft",
      style: "stone-slate",
      marginPattern: "none",
    };
    const r = updateThemeSchema.safeParse(base);
    expect(r.success && r.data.pageWidth).toBe("classic");
    expect(r.success && r.data.paper).toBe("default");
    expect(updateThemeSchema.safeParse({ ...base, pageWidth: "full", paper: "warm" }).success).toBe(
      true,
    );
    expect(updateThemeSchema.safeParse({ ...base, pageWidth: "50%" }).success).toBe(false);
    expect(updateThemeSchema.safeParse({ ...base, paper: "#000000" }).success).toBe(false);
  });

  it("rejects an unrecognised page style", () => {
    const r = updateThemeSchema.safeParse({
      accent: "#2563eb",
      font: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      radius: "soft",
      style: "cyberpunk",
    });
    expect(r.success).toBe(false);
  });
});
