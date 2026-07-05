"use client";

import { ACCENT_SWATCHES, FONT_STACKS, RADIUS_PRESETS, STYLE_OPTIONS } from "@hio/ui";
import { useActionState, useState } from "react";
import { type SettingsActionState, updateTheme } from "./actions";

const selectStyle = { padding: "0.6rem", borderRadius: 8, border: "1px solid #d1d5db" } as const;
const labelStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13 } as const;

export function SettingsForm({
  accent,
  font,
  radius,
  style,
}: {
  accent: string;
  font: string;
  radius: string;
  style: string;
}) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updateTheme,
    null,
  );
  const [selectedAccent, setSelectedAccent] = useState(accent);

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: "1.1rem", maxWidth: 420 }}
    >
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 13, marginBottom: 6 }}>Accent color</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {ACCENT_SWATCHES.map((s) => (
            <label key={s.value} style={{ cursor: "pointer" }}>
              <input
                type="radio"
                name="accent"
                value={s.value}
                checked={selectedAccent === s.value}
                onChange={() => setSelectedAccent(s.value)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
              <span
                title={s.name}
                style={{
                  display: "block",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: s.value,
                  border:
                    selectedAccent === s.value ? "2px solid #111827" : "2px solid transparent",
                  boxShadow: "0 0 0 1px #e5e7eb",
                }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label style={labelStyle}>
        Font
        <select name="font" defaultValue={font} style={selectStyle}>
          {FONT_STACKS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.name}
            </option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        Rounding
        <select name="radius" defaultValue={radius} style={selectStyle}>
          {RADIUS_PRESETS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        Page style
        <select name="style" defaultValue={style} style={selectStyle}>
          {STYLE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.name}
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
