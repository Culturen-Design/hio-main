import type { StyleVariant } from "./style";

/** Maps the shared `StyleVariant` to a card treatment for a module's outer wrapper. */
export function cardClasses(variant?: StyleVariant | null): string {
  switch (variant) {
    case "outlined":
      return "border border-border rounded-card";
    case "filled":
      return "bg-muted rounded-card";
    case "bold":
      return "border-2 border-foreground rounded-card";
    default:
      return "";
  }
}

/** Maps the shared `StyleVariant` to a heading treatment. */
export function headingClasses(variant?: StyleVariant | null): string {
  return variant === "bold" ? "font-bold" : "";
}
