"use client";

import { navLinkClasses } from "@hio/ui/admin";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <>
      {links.map(({ href, label }) => (
        <Link key={href} href={href} className={navLinkClasses(pathname.startsWith(href))}>
          {label}
        </Link>
      ))}
    </>
  );
}
