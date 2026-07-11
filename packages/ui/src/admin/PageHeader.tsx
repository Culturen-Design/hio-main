import type { ReactNode } from "react";
import { cn } from "../cn";

/**
 * Standard page opener: optional back link on top, then title + actions on one
 * (wrap-safe) row, then an optional description. Slots take ReactNode so each
 * app passes its own `<Link>`s — this package stays Next-free.
 */
export function PageHeader({
  title,
  description,
  backLink,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  backLink?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-1.5", className)}>
      {backLink ? <div className="text-xs text-muted-foreground">{backLink}</div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </header>
  );
}
