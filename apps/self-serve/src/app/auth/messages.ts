/**
 * Plain-language text for every auth screen, and the mapping from Supabase
 * auth errors to it. Pure (no Next or Supabase imports) so it's unit-tested.
 *
 * Privacy rule: no message may reveal whether an account exists for an email.
 * Supabase itself hides it on sign-up (a repeated sign-up returns a normal
 * success and sends nothing) and on password reset; our copy keeps that
 * promise by always offering the "already have an account?" way out instead
 * of saying which case applies.
 */

/** What a failed auth call tells us: Supabase's error `code` (stable) and
 *  `status`. The message text is never shown — it's English-only and can
 *  leak details. */
export type AuthErrorLike = { code?: string | null; status?: number | null } | null | undefined;

export type FriendlyError = {
  error: string;
  /** The email exists but isn't confirmed yet: the screen offers Resend. */
  unconfirmed?: boolean;
};

export function friendlyAuthError(
  e: AuthErrorLike,
  during: "login" | "signup" | "reset" | "update",
): FriendlyError {
  switch (e?.code) {
    case "invalid_credentials":
      return { error: "That email and password don't match. Check them, or reset your password." };
    case "email_not_confirmed":
      return {
        error: "Your email isn't confirmed yet. Use the link we sent you, or get a new one.",
        unconfirmed: true,
      };
    case "over_email_send_rate_limit":
      return {
        error:
          "We've sent several emails to this address just now. Wait a few minutes, then try again.",
      };
    case "over_request_rate_limit":
      return { error: "Too many attempts. Wait a minute, then try again." };
    case "weak_password":
      return { error: "Choose a stronger password: at least 8 characters, not a common one." };
    case "same_password":
      return { error: "That's your current password. Choose a new one." };
    case "user_banned":
      return { error: "This account is locked. Contact support if you think that's a mistake." };
    case "signup_disabled":
      return { error: "New sign-ups are paused right now. Please try again later." };
    case "session_not_found":
    case "session_expired":
      return { error: "Your reset link has expired. Ask for a new one." };
    default:
      break;
  }
  if (e?.status === 429) return { error: "Too many attempts. Wait a minute, then try again." };
  switch (during) {
    case "login":
      return { error: "We couldn't log you in just now. Please try again." };
    case "signup":
      return { error: "We couldn't create your account just now. Please try again." };
    case "reset":
      return { error: "We couldn't send the reset email just now. Please try again." };
    case "update":
      return { error: "We couldn't change your password just now. Please try again." };
  }
}

/** Notices shown on the login page after a redirect (`/login?notice=…`). */
export const LOGIN_NOTICES = {
  "link-invalid": {
    tone: "error",
    text: "That link didn't work. It may have expired or been used already. Log in below — if your email still needs confirming, we'll offer a new link.",
  },
  "password-updated": {
    tone: "success",
    text: "Your password is changed. Log in with the new one.",
  },
  "reset-expired": {
    tone: "error",
    text: "Your reset link has expired or was opened on another device. Ask for a new one.",
  },
} as const;

export type LoginNotice = keyof typeof LOGIN_NOTICES;

export function loginNotice(value: unknown): (typeof LOGIN_NOTICES)[LoginNotice] | null {
  return typeof value === "string" && value in LOGIN_NOTICES
    ? LOGIN_NOTICES[value as LoginNotice]
    : null;
}

/**
 * Where a confirmation or reset link may send the user afterwards. Only our
 * own paths: an open redirect here would let a crafted email link bounce a
 * freshly signed-in user to another site.
 */
export function safeNext(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** Hides most of an address for the "we sent it to …" line: "pr•••@gmail.com". */
export function maskEmail(email: string): string {
  const [name = "", domain = ""] = email.split("@");
  if (!domain) return email;
  const shown = name.slice(0, Math.min(2, name.length));
  return `${shown}${"•".repeat(Math.max(1, Math.min(6, name.length - shown.length)))}@${domain}`;
}
