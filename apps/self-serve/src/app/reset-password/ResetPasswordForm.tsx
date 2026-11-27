"use client";

import { AuthShell, Notice } from "@/app/auth/AuthForm";
import { updatePassword } from "@/app/auth/actions";
import { Button, Field, Input, Spinner } from "@hio/ui/admin";
import { useActionState } from "react";

export function ResetPasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(updatePassword, null);
  return (
    <AuthShell title="Choose a new password">
      <form action={formAction} className="flex flex-col gap-4">
        <p className="m-0 text-sm text-muted-foreground">
          For <strong className="font-semibold text-foreground">{email}</strong>. You'll be signed
          out everywhere and log in again with the new password.
        </p>
        {/* Lets password managers file the new password under the right account. */}
        <input type="hidden" name="username" autoComplete="username" value={email} />
        <Field label="New password" hint="At least 8 characters.">
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>
        <Field label="Repeat it">
          <Input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>
        {state && "error" in state && <Notice tone="error">{state.error}</Notice>}
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner label="Saving…" /> : "Change password"}
        </Button>
      </form>
    </AuthShell>
  );
}
