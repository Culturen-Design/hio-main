import { Card, buttonClasses } from "@hio/ui/admin";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

/** Shown for any unknown URL, including a page address nobody has claimed. */
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-muted px-4 py-8 sm:px-6">
      <Card className="w-full max-w-sm text-center">
        <p className="m-0 font-mono text-muted-foreground text-xs tracking-widest">[ 404 ]</p>
        <h1 className="mt-2 mb-1 text-lg font-semibold tracking-tight text-foreground">
          There's no page here
        </h1>
        <p className="m-0 text-muted-foreground text-sm">
          The address may be mistyped, or the page may have moved.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/" className={buttonClasses("primary")}>
            Go to hio
          </Link>
          <Link href="/signup" className={buttonClasses("secondary")}>
            Make your own page
          </Link>
        </div>
      </Card>
    </main>
  );
}
