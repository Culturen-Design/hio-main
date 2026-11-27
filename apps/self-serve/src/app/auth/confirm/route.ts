import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "../messages";

const OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
];

/**
 * Where links in auth emails land (sign-up confirmation, password reset).
 * Handles both link shapes Supabase can send:
 * - `?token_hash=…&type=…` (email templates using {{ .TokenHash }}): verified
 *   here, works on any device;
 * - `?code=…` (the default {{ .ConfirmationURL }} after Supabase has verified
 *   the email): exchanged for a session, which needs the browser the request
 *   started in.
 * Either way a good link signs the user in and sends them on to `next`
 * (our own paths only). A bad or expired link goes to the login page with a
 * plain notice — by then the email may well be confirmed, so logging in is
 * the right next step.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const isReset = next.startsWith("/reset-password") || type === "recovery";

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) return NextResponse.redirect(new URL(next, origin));
  const notice = isReset ? "reset-expired" : "link-invalid";
  return NextResponse.redirect(new URL(`/login?notice=${notice}`, origin));
}
