"use server";

import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { friendlyAuthError } from "./messages";

const email = z.string().trim().email("Enter a valid email");
const password = z.string().min(8, "Password must be at least 8 characters");
const credentials = z.object({ email, password });

export type AuthState =
  | { error: string; unconfirmed?: boolean; email?: string }
  /** An email went out (or, privately, didn't because the account exists):
   *  the screen switches to "Check your inbox". */
  | { sent: "signup" | "reset"; email: string }
  | { message: string }
  | null;

/** Where links in auth emails land: our confirm route, then `next`. */
function confirmUrl(next: string): string {
  const url = new URL("/auth/confirm", publicEnv.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("next", next);
  return url.toString();
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ...friendlyAuthError(error, "login"), email: parsed.data.email };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Create an account. With email confirmation on, Supabase returns no session
 * and sends a confirmation link. If the email already has an account it ALSO
 * returns a normal success but sends nothing (so the form can't be used to
 * test who has an account) — which is why the next screen always offers
 * "already have an account? log in or reset your password" rather than
 * promising an email.
 */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: confirmUrl("/dashboard?welcome=1") },
  });
  if (error) return friendlyAuthError(error, "signup");

  // Confirmation off (some dev setups): signed in already, and the
  // handle_new_user trigger has provisioned their page.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard?welcome=1");
  }
  return { sent: "signup", email: parsed.data.email };
}

/** Send the confirmation link again. Same privacy rule: the answer is the
 *  same whether or not the address has an unconfirmed account. */
export async function resendConfirmation(rawEmail: string): Promise<AuthState> {
  const parsed = email.safeParse(rawEmail);
  if (!parsed.success) return { error: "Enter a valid email" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: confirmUrl("/dashboard?welcome=1") },
  });
  if (error) return friendlyAuthError(error, "signup");
  return { sent: "signup", email: parsed.data };
}

/** Email a password-reset link. Always reports "sent", account or not. */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: confirmUrl("/reset-password"),
  });
  // Only rate limits are worth telling the user about; anything else would
  // either leak whether the account exists or be something they can't fix.
  if (error && (error.status === 429 || error.code?.startsWith("over_"))) {
    return friendlyAuthError(error, "reset");
  }
  if (error) console.error("[auth] reset email failed", error.code, error.status);
  return { sent: "reset", email: parsed.data };
}

/** Set a new password from the reset link's session. */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "The two passwords don't match" })
    .safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?notice=reset-expired");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return friendlyAuthError(error, "update");

  // Sign out everywhere so the new password is needed from now on.
  await supabase.auth.signOut({ scope: "global" });
  revalidatePath("/", "layout");
  redirect("/login?notice=password-updated");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
