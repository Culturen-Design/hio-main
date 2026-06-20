"use client";

import type { AuthState } from "@/app/auth/actions";
import { useActionState } from "react";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  action,
  title,
  submitLabel,
}: {
  action: Action;
  title: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <main
      style={{
        fontFamily: "system-ui",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <form
        action={formAction}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: "2rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{title}</h1>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            style={{ padding: "0.6rem", borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            style={{ padding: "0.6rem", borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </label>
        {state && "error" in state && (
          <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "0.7rem",
            borderRadius: 8,
            border: "none",
            background: "#111827",
            color: "white",
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "…" : submitLabel}
        </button>
        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }}>
          Studio is invite-only. Contact your admin for access.
        </p>
      </form>
    </main>
  );
}
