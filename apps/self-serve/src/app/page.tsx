import { buttonClasses } from "@hio/ui/admin";
import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-[640px]">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">hio</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Your page, built and edited by AI.
        </h1>
        <p className="mt-4 max-w-prose text-base text-muted-foreground">
          Sign up and get a personal page in seconds — then change anything just by asking.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className={buttonClasses("primary")}>
            Get started
          </Link>
          <Link href="/login" className={buttonClasses("secondary")}>
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
