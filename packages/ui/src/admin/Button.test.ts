import { describe, expect, it } from "vitest";
import { buttonClasses } from "./Button";

describe("buttonClasses", () => {
  it("defaults to primary/md", () => {
    const classes = buttonClasses();
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("h-9");
  });

  it("maps every variant to its surface", () => {
    expect(buttonClasses("primary")).toContain("bg-primary");
    expect(buttonClasses("secondary")).toContain("border-border");
    expect(buttonClasses("destructive")).toContain("bg-destructive");
    expect(buttonClasses("ghost")).toContain("hover:bg-muted");
  });

  it("only the ghost variant is surface-free", () => {
    expect(buttonClasses("ghost")).not.toMatch(/(^| )bg-/);
    expect(buttonClasses("secondary")).toMatch(/(^| )bg-background/);
  });

  it("maps sizes", () => {
    expect(buttonClasses("primary", "sm")).toContain("h-8");
    expect(buttonClasses("primary", "md")).toContain("h-9");
  });

  it("always keeps the focus ring and disabled treatment", () => {
    for (const variant of ["primary", "secondary", "destructive", "ghost"] as const) {
      expect(buttonClasses(variant)).toContain("focus-visible:outline-2");
      expect(buttonClasses(variant)).toContain("disabled:opacity-50");
    }
  });
});
