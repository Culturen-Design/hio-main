"use client";

import { Badge, Button, ConfirmDialog, Spinner, toastFromResult, useToast } from "@hio/ui/admin";
import { useState, useTransition } from "react";
import { setSitePublished } from "./actions";

export function PublishControls({
  tenantId,
  siteSlug,
  isPublished,
}: {
  tenantId: string;
  siteSlug: string;
  isPublished: boolean;
}) {
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const publicHref = `/sites/${siteSlug}`;

  const apply = (publish: boolean) => {
    const formData = new FormData();
    formData.set("tenant_id", tenantId);
    formData.set("publish", String(publish));
    start(async () => {
      const res = await setSitePublished(null, formData);
      const t = toastFromResult(
        res ?? { ok: true },
        publish ? "Site published" : "Site unpublished",
      );
      if (t) toast(t);
    });
  };

  return (
    <div className="flex max-w-[480px] flex-col gap-2.5">
      <p className="m-0 flex items-center gap-2 text-sm">
        Status:
        <Badge tone={isPublished ? "success" : "neutral"}>
          {isPublished ? "Published" : "Draft"}
        </Badge>
      </p>

      {isPublished && (
        <p className="m-0 text-sm">
          Public page:{" "}
          <a
            href={publicHref}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline hover:text-muted-foreground"
          >
            {publicHref} ↗
          </a>
        </p>
      )}

      <div>
        <Button
          variant={isPublished ? "secondary" : "primary"}
          disabled={pending}
          // Unpublishing takes the client's live site down — that gets a confirm.
          onClick={() => (isPublished ? setConfirmingUnpublish(true) : apply(true))}
        >
          {pending ? <Spinner label="Working…" /> : isPublished ? "Unpublish" : "Publish"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingUnpublish}
        title="Unpublish this site?"
        description={`The public page at ${publicHref} will stop being served until you publish again.`}
        confirmLabel="Unpublish"
        destructive
        onConfirm={() => {
          setConfirmingUnpublish(false);
          apply(false);
        }}
        onCancel={() => setConfirmingUnpublish(false)}
      />
    </div>
  );
}
