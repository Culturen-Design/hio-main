"use client";

import { AuthShell, CheckInbox, Notice } from "@/app/auth/AuthForm";
import { requestPasswordReset } from "@/app/auth/actions";
import { Button, Field, Input, Spinner } from "@hio/ui/admin";
import Link from "next/link";
import { useActionState, useState } from "react";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);
  const [restart, setRestart] = useState(0);

  if (state && "sent" in state && restart === 0) {
    return <CheckInbox kind="reset" email={state.email} onRestart={() => setRestart(1)} />;
  }

  return (
    <AuthShell title="Reset your password">
      <form action={formAction} className="flex flex-col gap-4" key={restart}>
        <p className="m-0 text-sm text-muted-foreground">
          Enter the email you signed up with. We'll send a link to choose a new password.
        </p>
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        {state && "error" in state && <Notice tone="error">{state.error}</Notice>}
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner label="Sending…" /> : "Send reset link"}
        </Button>
        <Link
          href="/login"
          className="text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to log in
        </Link>
      </form>
    </AuthShell>
  );
}
