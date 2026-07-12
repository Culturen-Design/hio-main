"use client";

import { Button, Field, Input, Select, Spinner, buttonClasses } from "@hio/ui/admin";
import Link from "next/link";
import { useActionState } from "react";
import { type ClientActionState, createStudioClient } from "./actions";
import { SCHEMA_VARIANTS } from "./validation";

/**
 * Stays on useActionState: success redirects to the new client's page, so
 * only the error state ever renders — no success-toast ambiguity here.
 */
export function NewClientForm() {
  const [state, formAction, pending] = useActionState<ClientActionState, FormData>(
    createStudioClient,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Client name">
        <Input name="name" type="text" required placeholder="Acme Co" />
      </Field>
      <Field label="Slug">
        <Input name="slug" type="text" required pattern="[a-z0-9-]+" placeholder="acme-co" />
        <span className="text-xs font-normal text-muted-foreground">
          Lowercase letters, numbers, and hyphens. Used for the client’s URL.
        </span>
      </Field>
      <Field label="Schema variant">
        <Select name="schema_variant" defaultValue={SCHEMA_VARIANTS[0]}>
          {SCHEMA_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
        <span className="text-xs font-normal text-muted-foreground">
          The module set this client can use (resolved by the AI engine).
        </span>
      </Field>

      {state && "error" in state && (
        <p role="alert" className="m-0 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner label="Creating…" /> : "Create client"}
        </Button>
        <Link href="/dashboard" className={buttonClasses("secondary")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
