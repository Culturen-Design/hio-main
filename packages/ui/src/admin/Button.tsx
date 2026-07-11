import type { ComponentProps } from "react";
import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap " +
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-border bg-background text-foreground hover:bg-muted",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
  ghost: "text-foreground hover:bg-muted",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

/**
 * The admin button look as a plain class string, so non-button elements
 * (`<Link>`, `<a>`) can wear it without a wrapper component.
 */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cn(base, variants[variant], sizes[size]);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={cn(buttonClasses(variant, size), className)} {...props} />;
}
