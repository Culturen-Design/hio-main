import type { ReactNode } from "react";
import { cn } from "../cn";

/**
 * Nav-link look for the shell's nav slot. A helper (not a component) for the
 * same reason as `buttonClasses`: each app brings its own `<Link>`.
 */
export function navLinkClasses(active = false): string {
  return cn(
    "inline-flex h-full items-center border-b-2 px-1 text-sm whitespace-nowrap transition-colors",
    active
      ? "border-primary font-medium text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground",
  );
}

/**
 * The persistent admin app shell: a sticky 3.5rem header (brand / nav /
 * actions) over the page content. The builder's full-height layout relies on
 * the header being exactly h-14 — keep them in sync.
 */
export function AdminShell({
  brand,
  nav,
  actions,
  children,
}: {
  brand: ReactNode;
  nav?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-full items-center gap-4 px-4 sm:gap-6 sm:px-6">
          <div className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
            {brand}
          </div>
          {nav ? (
            // overflow-y-hidden: the header's 1px bottom border leaves 55px inside, and
            // a 56px link would otherwise give the nav a stray vertical scrollbar.
            <nav className="flex h-full min-w-0 flex-1 items-center gap-4 overflow-x-auto overflow-y-hidden whitespace-nowrap">
              {nav}
            </nav>
          ) : (
            <div className="flex-1" />
          )}
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
