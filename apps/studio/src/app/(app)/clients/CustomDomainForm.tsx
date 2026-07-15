"use client";

import { Button, Input, Spinner, toastFromResult, useToast } from "@hio/ui/admin";
import { type FormEvent, useTransition } from "react";
import { setCustomDomain } from "./actions";

export function CustomDomainForm({
  tenantId,
  customDomain,
}: {
  tenantId: string;
  customDomain: string | null;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    start(async () => {
      const res = await setCustomDomain(null, formData);
      const t = toastFromResult(res ?? { ok: true }, "Domain mapping saved");
      if (t) toast(t);
    });
  }

  return (
    <div className="flex max-w-[520px] flex-col gap-2.5">
      {customDomain ? (
        <p className="m-0 text-sm">
          Mapped:{" "}
          <a
            href={`https://${customDomain}/`}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline hover:text-muted-foreground"
          >
            {customDomain} ↗
          </a>
        </p>
      ) : (
        <p className="m-0 text-sm text-muted-foreground">No custom domain mapped.</p>
      )}

      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={tenantId} />
        <Input
          type="text"
          name="custom_domain"
          defaultValue={customDomain ?? ""}
          placeholder="example.com"
          aria-label="Custom domain"
          autoComplete="off"
          spellCheck={false}
          className="w-auto min-w-0 flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner label="Saving…" /> : "Save"}
        </Button>
      </form>

      <p className="m-0 text-xs leading-relaxed text-muted-foreground">
        Leave empty and Save to remove the mapping. After saving, add this domain to the Studio
        Netlify site (Domain management → Add domain alias) and point its DNS at Netlify. Once the
        certificate is issued, the domain serves this client's published site.
      </p>
    </div>
  );
}
