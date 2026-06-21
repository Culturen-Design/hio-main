"use client";

import { useActionState } from "react";
import { type ClientActionState, setCustomDomain } from "./actions";

export function CustomDomainForm({
  tenantId,
  customDomain,
}: {
  tenantId: string;
  customDomain: string | null;
}) {
  const [state, formAction, pending] = useActionState<ClientActionState, FormData>(
    setCustomDomain,
    null,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxWidth: 520 }}>
      {customDomain ? (
        <p style={{ margin: 0, fontSize: 14 }}>
          Mapped:{" "}
          <a
            href={`https://${customDomain}/`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#4f46e5", fontWeight: 600 }}
          >
            {customDomain} ↗
          </a>
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>No custom domain mapped.</p>
      )}

      <form action={formAction} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="hidden" name="id" value={tenantId} />
        <input
          type="text"
          name="custom_domain"
          defaultValue={customDomain ?? ""}
          placeholder="example.com"
          aria-label="Custom domain"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            padding: "0.5rem 0.6rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: 8,
            border: "none",
            background: "#111827",
            color: "white",
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "…" : "Save"}
        </button>
      </form>

      <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
        Leave empty and Save to remove the mapping. After saving, add this domain to the Studio
        Netlify site (Domain management → Add domain alias) and point its DNS at Netlify. Once the
        certificate is issued, the domain serves this client's published site.
      </p>

      {state && "error" in state && (
        <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
