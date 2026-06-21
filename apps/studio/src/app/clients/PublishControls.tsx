"use client";

import { useActionState } from "react";
import { type ClientActionState, setSitePublished } from "./actions";

export function PublishControls({
  tenantId,
  siteSlug,
  isPublished,
}: {
  tenantId: string;
  siteSlug: string;
  isPublished: boolean;
}) {
  const [state, formAction, pending] = useActionState<ClientActionState, FormData>(
    setSitePublished,
    null,
  );
  const publicHref = `/sites/${siteSlug}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxWidth: 480 }}>
      <p style={{ margin: 0, fontSize: 14 }}>
        Status:{" "}
        <strong style={{ color: isPublished ? "#16a34a" : "#b45309" }}>
          {isPublished ? "Published" : "Draft"}
        </strong>
      </p>

      {isPublished && (
        <p style={{ margin: 0, fontSize: 13 }}>
          Public page:{" "}
          <a href={publicHref} target="_blank" rel="noreferrer" style={{ color: "#4f46e5" }}>
            {publicHref} ↗
          </a>
        </p>
      )}

      <form action={formAction} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="hidden" name="tenant_id" value={tenantId} />
        <input type="hidden" name="publish" value={(!isPublished).toString()} />
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: 8,
            border: isPublished ? "1px solid #d1d5db" : "none",
            background: isPublished ? "white" : "#16a34a",
            color: isPublished ? "#111827" : "white",
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "…" : isPublished ? "Unpublish" : "Publish"}
        </button>
      </form>

      {state && "error" in state && (
        <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
