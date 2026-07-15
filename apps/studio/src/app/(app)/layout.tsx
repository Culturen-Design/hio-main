import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { AdminShell, Button, ToastProvider } from "@hio/ui/admin";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { NavLinks } from "./NavLinks";

/**
 * Shell for every authed Studio route (dashboard + clients — the group keeps
 * URLs unchanged). Login, the public /sites/[slug] + /hosted renders, and the
 * unauthed /clients/preview iframe route stay outside the group: no shell.
 * The staff (is_admin) gate stays in the pages — the dashboard renders its
 * "No Studio access" card for an authed non-staff user.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <AdminShell
        brand={<Link href="/dashboard">hio Studio</Link>}
        nav={<NavLinks links={[{ href: "/dashboard", label: "Clients" }]} />}
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
