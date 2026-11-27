"use client";

import { type AuthState, resendConfirmation } from "@/app/auth/actions";
import { maskEmail } from "@/app/auth/messages";
import { Button, Card, Field, Input, Spinner } from "@hio/ui/admin";
import Link from "next/link";
import { type ReactNode, useActionState, useEffect, useState, useTransition } from "react";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

/** The centred card every signed-out screen uses. */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-muted px-4 py-8 sm:px-6">
      <Card className="w-full max-w-sm">
        <h1 className="m-0 mb-4 text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        {children}
      </Card>
    </main>
  );
}

export function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return tone === "error" ? (
    <p role="alert" className="m-0 text-sm text-destructive">
      {children}
    </p>
  ) : (
    <output className="m-0 block text-sm text-success">{children}</output>
  );
}

const linkClass =
  "text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline";

/** Login and sign-up. Sign-up switches to "Check your inbox" once sent. */
export function AuthForm({
  action,
  title,
  submitLabel,
  altHref,
  altLabel,
  newPassword = false,
  notice,
}: {
  action: Action;
  /** Sign-up: the browser should offer to generate and save a new password. */
  newPassword?: boolean;
  title: string;
  submitLabel: string;
  altHref: string;
  altLabel: string;
  /** A message carried over from a redirect (e.g. "password changed"). */
  notice?: { tone: "error" | "success"; text: string } | null;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [restart, setRestart] = useState(0);

  if (state && "sent" in state && restart === 0) {
    return <CheckInbox kind={state.sent} email={state.email} onRestart={() => setRestart(1)} />;
  }

  return (
    <AuthShell title={title}>
      <form action={formAction} className="flex flex-col gap-4" key={restart}>
        {notice && !state ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" hint={newPassword ? "At least 8 characters." : undefined}>
          <Input
            name="password"
            type="password"
            autoComplete={newPassword ? "new-password" : "current-password"}
            required
            minLength={8}
          />
        </Field>
        {!newPassword && (
          <Link href="/forgot-password" className={`-mt-2 self-end ${linkClass}`}>
            Forgot password?
          </Link>
        )}
        {state && "error" in state && <Notice tone="error">{state.error}</Notice>}
        {state && "error" in state && state.unconfirmed && state.email ? (
          <ResendButton email={state.email} />
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner label="Submitting…" /> : submitLabel}
        </Button>
        <Link href={altHref} className={`text-center ${linkClass}`}>
          {altLabel}
        </Link>
      </form>
    </AuthShell>
  );
}

/**
 * After sign-up or a reset request. Deliberately the same screen whether or
 * not an account already exists (Supabase sends nothing to an existing
 * account on sign-up, and we mustn't reveal which case it is), so it always
 * offers the way out for someone who already has an account.
 */
export function CheckInbox({
  kind,
  email,
  onRestart,
}: {
  kind: "signup" | "reset";
  email: string;
  onRestart: () => void;
}) {
  return (
    <AuthShell title="Check your inbox">
      <div className="flex flex-col gap-4 text-sm">
        <p className="m-0 text-foreground">
          {kind === "signup"
            ? "If this address can be used, we've sent a link to confirm it to "
            : "If there's an account for this address, we've sent a link to reset its password to "}
          <strong className="font-semibold">{maskEmail(email)}</strong>. It usually arrives within a
          minute or two. Check your spam folder too.
        </p>
        {kind === "signup" ? (
          <>
            <p className="m-0 text-muted-foreground">
              The link opens your new page. Open it on this device if you can.
            </p>
            <div className="rounded-lg bg-muted px-3 py-2.5 text-muted-foreground">
              <strong className="font-semibold text-foreground">Already have an account?</strong> We
              don't send a new link then.{" "}
              <Link href="/login" className="text-foreground underline underline-offset-2">
                Log in
              </Link>{" "}
              or{" "}
              <Link
                href="/forgot-password"
                className="text-foreground underline underline-offset-2"
              >
                reset your password
              </Link>
              .
            </div>
            <ResendButton email={email} />
          </>
        ) : (
          <p className="m-0 text-muted-foreground">
            The link lets you choose a new password. It works once and expires after an hour.
          </p>
        )}
        <button type="button" onClick={onRestart} className={`self-start ${linkClass}`}>
          Wrong address? Start again
        </button>
      </div>
    </AuthShell>
  );
}

const COOLDOWN = 60;

/** Sends the confirmation link again, at most once a minute. */
function ResendButton({ email }: { email: string }) {
  const [pending, start] = useTransition();
  const [wait, setWait] = useState(0);
  const [result, setResult] = useState<AuthState>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending || wait > 0}
        onClick={() =>
          start(async () => {
            const res = await resendConfirmation(email);
            setResult(res);
            if (res && "sent" in res) setWait(COOLDOWN);
          })
        }
      >
        {pending ? (
          <Spinner label="Sending…" />
        ) : wait > 0 ? (
          `Send again in ${wait}s`
        ) : (
          "Send the confirmation link again"
        )}
      </Button>
      {result && "sent" in result ? (
        <Notice tone="success">Sent again. Use the newest email — older links stop working.</Notice>
      ) : null}
      {result && "error" in result ? <Notice tone="error">{result.error}</Notice> : null}
    </div>
  );
}
