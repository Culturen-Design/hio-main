import type { ComponentProps } from "react";
import { cn } from "../cn";

export type BadgeTone = "neutral" | "primary" | "destructive" | "success";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary text-primary-foreground",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
