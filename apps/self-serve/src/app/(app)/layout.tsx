import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { AdminShell, Button, ToastProvider } from "@hio/ui/admin";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { NavLinks } from "./NavLinks";

/**
 * Shell for every authed route (dashboard/builder/settings/admin — the group
 * keeps URLs unchanged). Auth pages, the landing page, the public /[slug]
 * render, and the unauthed /settings/preview iframe route all live outside
 * the group on purpose: no shell there.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: settings } = await supabase
    .from("user_settings")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/builder", label: "Builder" },
    { href: "/settings", label: "Site look" },
    ...(settings?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <ToastProvider>
      <AdminShell
        brand={<Link href="/dashboard">hio</Link>}
        nav={<NavLinks links={links} />}
        actions={
          <>
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </>
        }
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
