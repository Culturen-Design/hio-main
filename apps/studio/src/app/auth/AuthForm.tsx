"use client";

import type { AuthState } from "@/app/auth/actions";
import { Button, Card, Field, Input, Spinner } from "@hio/ui/admin";
import { useActionState } from "react";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  action,
  title,
  submitLabel,
}: {
  action: Action;
  title: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <main className="grid min-h-dvh place-items-center bg-muted px-4 py-8 sm:px-6">
      <Card className="w-full max-w-sm">
        <form action={formAction} className="flex flex-col gap-4">
          <h1 className="m-0 text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </Field>
          {state && "error" in state && (
            <p role="alert" className="m-0 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner label="Submitting…" /> : submitLabel}
          </Button>
          <p className="m-0 text-center text-xs text-muted-foreground">
            Studio is invite-only. Contact your admin for access.
          </p>
        </form>
      </Card>
    </main>
  );
}
