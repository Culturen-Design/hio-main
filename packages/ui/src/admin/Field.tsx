import type { ComponentProps, ReactNode } from "react";
import { cn } from "../cn";

const controlClasses =
  "w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 " +
  "focus:outline-primary disabled:pointer-events-none disabled:opacity-50";

/** Label + control + optional error slot. The control goes in as children. */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  /** One plain-language line under the label explaining what the control does. */
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children, so it does sit inside the label — static analysis just can't see through the slot.
    <label className={cn("flex flex-col gap-1.5 text-xs font-medium text-foreground", className)}>
      {label}
      {hint ? <span className="font-normal text-muted-foreground">{hint}</span> : null}
      {children}
      {error ? (
        <span role="alert" className="font-normal text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClasses, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClasses, "min-h-20 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlClasses, "h-9", className)} {...props} />;
}
