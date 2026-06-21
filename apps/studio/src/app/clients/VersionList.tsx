"use client";

import { useActionState } from "react";
import { type ClientActionState, restoreSiteVersion, snapshotSite } from "./actions";

export type SiteVersion = { id: string; label: string; created_at: string };

const btn: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
  fontSize: 13,
};

export function VersionList({
  tenantId,
  siteId,
  versions,
}: {
  tenantId: string;
  siteId: string;
  versions: SiteVersion[];
}) {
  const [saveState, saveAction, saving] = useActionState<ClientActionState, FormData>(
    snapshotSite,
    null,
  );
  const [restoreState, restoreAction, restoring] = useActionState<ClientActionState, FormData>(
    restoreSiteVersion,
    null,
  );
  const busy = saving || restoring;
  const error =
    (saveState && "error" in saveState && saveState.error) ||
    (restoreState && "error" in restoreState && restoreState.error) ||
    null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 520 }}>
      <form action={saveAction}>
        <input type="hidden" name="tenant_id" value={tenantId} />
        <input type="hidden" name="site_id" value={siteId} />
        <button type="submit" disabled={busy} style={{ ...btn, fontWeight: 600 }}>
          {saving ? "Saving…" : "Save version"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>
          {error}
        </p>
      )}

      {versions.length === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
          No versions yet. Saving or publishing creates one.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
          {versions.map((v) => (
            <li
              key={v.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "0.5rem 0.85rem",
              }}
            >
              <span style={{ fontSize: 13 }}>
                <strong>{v.label}</strong>
                <span style={{ color: "#9ca3af" }}>
                  {" "}
                  · {new Date(v.created_at).toLocaleString()}
                </span>
              </span>
              <form action={restoreAction}>
                <input type="hidden" name="tenant_id" value={tenantId} />
                <input type="hidden" name="version_id" value={v.id} />
                <button type="submit" disabled={busy} style={btn}>
                  {restoring ? "…" : "Restore"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
