"use client";

import { useActionState } from "react";
import { type ClientActionState, createStudioClient } from "./actions";
import { SCHEMA_VARIANTS } from "./validation";

const inputStyle = { padding: "0.6rem", borderRadius: 8, border: "1px solid #d1d5db" } as const;
const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
} as const;

export function NewClientForm() {
  const [state, formAction, pending] = useActionState<ClientActionState, FormData>(
    createStudioClient,
    null,
  );

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: "0.9rem", maxWidth: 420 }}
    >
      <label style={labelStyle}>
        Client name
        <input name="name" type="text" required placeholder="Acme Co" style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Slug
        <input
          name="slug"
          type="text"
          required
          pattern="[a-z0-9-]+"
          placeholder="acme-co"
          style={inputStyle}
        />
        <span style={{ color: "#9ca3af", fontSize: 12 }}>
          Lowercase letters, numbers, and hyphens. Used for the client’s URL.
        </span>
      </label>
      <label style={labelStyle}>
        Schema variant
        <select name="schema_variant" defaultValue={SCHEMA_VARIANTS[0]} style={inputStyle}>
          {SCHEMA_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <span style={{ color: "#9ca3af", fontSize: 12 }}>
          The module set this client can use (resolved by the AI engine).
        </span>
      </label>

      {state && "error" in state && (
        <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>
          {state.error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "0.65rem 1.1rem",
            borderRadius: 8,
            border: "none",
            background: "#111827",
            color: "white",
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Creating…" : "Create client"}
        </button>
        <a
          href="/dashboard"
          style={{
            padding: "0.65rem 1.1rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
