import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Choose a new password" };

/** Reached from the reset email via /auth/confirm, which signs the user in
 *  for this step. Without that session the link has expired or was opened
 *  somewhere else. */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login?notice=reset-expired");
  return <ResetPasswordForm email={user.email} />;
}
