"use client";

import type { AuthState } from "@/app/auth/actions";
import { Button, Card, Field, Input, Spinner } from "@hio/ui/admin";
import Link from "next/link";
import { useActionState } from "react";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  action,
  title,
  submitLabel,
  altHref,
  altLabel,
}: {
  action: Action;
  title: string;
  submitLabel: string;
  altHref: string;
  altLabel: string;
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
          {state && "message" in state && (
            <output className="m-0 text-sm text-success">{state.message}</output>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner label="Submitting…" /> : submitLabel}
          </Button>
          <Link
            href={altHref}
            className="text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {altLabel}
          </Link>
        </form>
      </Card>
    </main>
  );
}
