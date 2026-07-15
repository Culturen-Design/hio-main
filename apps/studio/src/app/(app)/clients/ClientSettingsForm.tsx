"use client";

import { Button, Field, Input, Select, Spinner, toastFromResult, useToast } from "@hio/ui/admin";
import { type FormEvent, useTransition } from "react";
import { updateStudioClient } from "./actions";
import { SCHEMA_VARIANTS } from "./validation";

export function ClientSettingsForm({
  id,
  name,
  schemaVariant,
}: {
  id: string;
  name: string;
  schemaVariant: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateStudioClient(null, formData);
      const t = toastFromResult(res ?? { ok: true }, "Client settings saved");
      if (t) toast(t);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[420px] flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <Field label="Client name">
        <Input name="name" type="text" required defaultValue={name} />
      </Field>
      <Field label="Schema variant">
        <Select name="schema_variant" defaultValue={schemaVariant}>
          {SCHEMA_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? <Spinner label="Saving…" /> : "Save changes"}
      </Button>
    </form>
  );
}
