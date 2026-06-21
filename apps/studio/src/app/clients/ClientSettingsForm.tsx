"use client";

import { useActionState } from "react";
import { type ClientActionState, updateStudioClient } from "./actions";
import { SCHEMA_VARIANTS } from "./validation";

const inputStyle = { padding: "0.6rem", borderRadius: 8, border: "1px solid #d1d5db" } as const;
const labelStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13 } as const;

export function ClientSettingsForm({
  id,
  name,
  schemaVariant,
}: {
  id: string;
  name: string;
  schemaVariant: string;
}) {
  const [state, formAction, pending] = useActionState<ClientActionState, FormData>(
    updateStudioClient,
    null,
  );

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: "0.9rem", maxWidth: 420 }}
    >
      <input type="hidden" name="id" value={id} />
      <label style={labelStyle}>
        Client name
        <input name="name" type="text" required defaultValue={name} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Schema variant
        <select name="schema_variant" defaultValue={schemaVariant} style={inputStyle}>
          {SCHEMA_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>

      {state && "error" in state && (
        <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>
          {state.error}
        </p>
      )}
      {state === null && <output style={{ color: "#16a34a", fontSize: 13 }} aria-live="polite" />}

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
          alignSelf: "flex-start",
        }}
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
