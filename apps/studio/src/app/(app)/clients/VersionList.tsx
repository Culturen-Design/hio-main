"use client";

import { Button, ConfirmDialog, Spinner, toastFromResult, useToast } from "@hio/ui/admin";
import { useState, useTransition } from "react";
import { restoreSiteVersion, snapshotSite } from "./actions";

export type SiteVersion = { id: string; label: string; created_at: string };

export function VersionList({
  tenantId,
  siteId,
  versions,
}: {
  tenantId: string;
  siteId: string;
  versions: SiteVersion[];
}) {
  const [restoring, setRestoring] = useState<SiteVersion | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();

  const save = () => {
    const formData = new FormData();
    formData.set("tenant_id", tenantId);
    formData.set("site_id", siteId);
    start(async () => {
      const res = await snapshotSite(null, formData);
      const t = toastFromResult(res ?? { ok: true }, "Version saved");
      if (t) toast(t);
    });
  };

  const restore = (version: SiteVersion) => {
    const formData = new FormData();
    formData.set("tenant_id", tenantId);
    formData.set("version_id", version.id);
    start(async () => {
      const res = await restoreSiteVersion(null, formData);
      const t = toastFromResult(res ?? { ok: true }, `Restored "${version.label}"`);
      if (t) toast(t);
    });
  };

  return (
    <div className="flex max-w-[520px] flex-col gap-3">
      <div>
        <Button variant="secondary" size="sm" disabled={pending} onClick={save}>
          {pending ? <Spinner label="Working…" /> : "Save version"}
        </Button>
      </div>

      {versions.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">
          No versions yet. Saving or publishing creates one.
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
            >
              <span className="text-sm">
                <strong>{v.label}</strong>
                <span className="text-muted-foreground">
                  {" "}
                  · {new Date(v.created_at).toLocaleString()}
                </span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                // Restoring replaces the site's current content — that gets a confirm.
                onClick={() => setRestoring(v)}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={restoring !== null}
        title="Restore this version?"
        description={
          restoring
            ? `The site's current content will be replaced by "${restoring.label}". A "Before restore" snapshot is saved first, so this is reversible.`
            : undefined
        }
        confirmLabel="Restore"
        onConfirm={() => {
          const v = restoring;
          setRestoring(null);
          if (v) restore(v);
        }}
        onCancel={() => setRestoring(null)}
      />
    </div>
  );
}
