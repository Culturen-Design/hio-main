"use client";

import { FREE_MODULE_TYPES, type ModuleType } from "@hio/content-model";
import { useState, useTransition } from "react";
import { type ActionResult, setModuleOverrides, setTier } from "./actions";

export type AdminUserRow = {
  userId: string;
  slug: string | null;
  tier: "free" | "paid";
  overrides: string[];
  isAdmin: boolean;
  isLocked: boolean;
  isDisabled: boolean;
};

const cell: React.CSSProperties = {
  padding: "0.6rem 0.5rem",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
  fontSize: 14,
};

const badge = (label: string, color: string): React.CSSProperties => ({
  display: "inline-block",
  fontSize: 11,
  fontWeight: 600,
  padding: "0.1rem 0.4rem",
  borderRadius: 999,
  background: color,
  color: "white",
  marginLeft: 4,
});

export function AdminTable({
  rows,
  moduleTypes,
}: {
  rows: AdminUserRow[];
  moduleTypes: ModuleType[];
}) {
  // Free modules are always available; overrides only grant the *extra* ones.
  const extraModules = moduleTypes.filter((t) => !FREE_MODULE_TYPES.includes(t));

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
      <thead>
        <tr style={{ textAlign: "left", fontSize: 12, color: "#6b7280" }}>
          <th style={cell}>User</th>
          <th style={cell}>Tier</th>
          <th style={cell}>Extra modules (overrides)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <AdminRow key={row.userId} row={row} extraModules={extraModules} />
        ))}
      </tbody>
    </table>
  );
}

function AdminRow({ row, extraModules }: { row: AdminUserRow; extraModules: ModuleType[] }) {
  const extraSet = new Set(extraModules as string[]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(row.overrides.filter((t) => extraSet.has(t))),
  );
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<ActionResult>, okMsg: string) =>
    start(async () => {
      const res = await fn();
      setMsg("error" in res ? res.error : okMsg);
    });

  const toggle = (type: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <tr>
      <td style={cell}>
        <div style={{ fontWeight: 600 }}>
          {row.slug ? `/${row.slug}` : "—"}
          {row.isAdmin && <span style={badge("admin", "#7c3aed")}>admin</span>}
          {row.isLocked && <span style={badge("locked", "#dc2626")}>locked</span>}
          {row.isDisabled && <span style={badge("disabled", "#6b7280")}>disabled</span>}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>{row.userId}</div>
        {msg && <div style={{ fontSize: 12, color: "#2563eb", marginTop: 4 }}>{msg}</div>}
      </td>

      <td style={cell}>
        <select
          defaultValue={row.tier}
          disabled={pending}
          onChange={(e) => run(() => setTier(row.userId, e.target.value), "Tier updated")}
          style={{ padding: "0.3rem 0.5rem", borderRadius: 6, border: "1px solid #d1d5db" }}
        >
          <option value="free">free</option>
          <option value="paid">paid</option>
        </select>
      </td>

      <td style={cell}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 0.9rem" }}>
          {extraModules.map((type) => (
            <label
              key={type}
              style={{ fontSize: 13, display: "inline-flex", gap: 4, alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={selected.has(type)}
                disabled={pending}
                onChange={() => toggle(type)}
              />
              {type}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => setModuleOverrides(row.userId, [...selected] as ModuleType[]),
              "Overrides saved",
            )
          }
          style={{
            marginTop: 8,
            padding: "0.3rem 0.7rem",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "white",
            cursor: pending ? "default" : "pointer",
            fontSize: 13,
          }}
        >
          Save overrides
        </button>
      </td>
    </tr>
  );
}
