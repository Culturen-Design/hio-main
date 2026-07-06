"use client";

import { FREE_MODULE_TYPES, type ModuleType } from "@hio/content-model";
import { useState, useTransition } from "react";
import { type ActionResult, setDisabled, setLocked, setModuleOverrides, setTier } from "./actions";

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
  currentUserId,
}: {
  rows: AdminUserRow[];
  moduleTypes: ModuleType[];
  currentUserId: string;
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
          <th style={cell}>Access</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <AdminRow
            key={row.userId}
            row={row}
            extraModules={extraModules}
            isSelf={row.userId === currentUserId}
          />
        ))}
      </tbody>
    </table>
  );
}

const statusStyle = (kind: "saving" | "saved" | "error"): React.CSSProperties => ({
  fontSize: 12,
  marginTop: 4,
  color: kind === "error" ? "#dc2626" : kind === "saving" ? "#9ca3af" : "#16a34a",
});

const accessBtn = (active: boolean, color: string): React.CSSProperties => ({
  padding: "0.25rem 0.6rem",
  borderRadius: 6,
  border: `1px solid ${active ? color : "#d1d5db"}`,
  background: active ? color : "white",
  color: active ? "white" : "#374151",
  fontSize: 12,
  cursor: "pointer",
});

function AdminRow({
  row,
  extraModules,
  isSelf,
}: {
  row: AdminUserRow;
  extraModules: ModuleType[];
  isSelf: boolean;
}) {
  const extraSet = new Set(extraModules as string[]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(row.overrides.filter((t) => extraSet.has(t))),
  );
  const [tier, setTierState] = useState(row.tier);
  const [locked, setLockedState] = useState(row.isLocked);
  const [disabled, setDisabledState] = useState(row.isDisabled);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ kind: "saving" | "saved" | "error"; text: string } | null>(
    null,
  );

  // A single save pattern for every control in this row: fire immediately on
  // change, show "Saving…" while pending, then "Saved"/the server error —
  // no separate "Save" button anywhere (tier used to autosave while overrides
  // needed an explicit click; this closes that inconsistency).
  const run = (fn: () => Promise<ActionResult>, savedText: string) => {
    setStatus({ kind: "saving", text: "Saving…" });
    start(async () => {
      const res = await fn();
      setStatus(
        "error" in res ? { kind: "error", text: res.error } : { kind: "saved", text: savedText },
      );
    });
  };

  const toggleModule = (type: string) => {
    const next = new Set(selected);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setSelected(next);
    run(() => setModuleOverrides(row.userId, [...next] as ModuleType[]), "Overrides saved");
  };

  const changeTier = (next: string) => {
    // Downgrading a paid user silently walls off any paid-only modules
    // already on their page — confirm before it's irreversible-feeling.
    if (row.tier === "paid" && next === "free") {
      const ok = window.confirm(
        "Downgrade this user to the free tier? Any paid-only modules already on their page will stop being editable until they're upgraded again.",
      );
      if (!ok) return;
    }
    setTierState(next as "free" | "paid");
    run(() => setTier(row.userId, next), "Tier updated");
  };

  const toggleLocked = () => {
    const next = !locked;
    setLockedState(next);
    run(() => setLocked(row.userId, next), next ? "Locked" : "Unlocked");
  };

  const toggleDisabled = () => {
    const next = !disabled;
    setDisabledState(next);
    run(() => setDisabled(row.userId, next), next ? "Disabled" : "Enabled");
  };

  return (
    <tr>
      <td style={cell}>
        <div style={{ fontWeight: 600 }}>
          {row.slug ? `/${row.slug}` : "—"}
          {row.isAdmin && <span style={badge("admin", "#7c3aed")}>admin</span>}
          {isSelf && <span style={badge("you", "#2563eb")}>you</span>}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>{row.userId}</div>
        {status && <div style={statusStyle(status.kind)}>{status.text}</div>}
      </td>

      <td style={cell}>
        <select
          value={tier}
          disabled={pending}
          onChange={(e) => changeTier(e.target.value)}
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
                onChange={() => toggleModule(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </td>

      <td style={cell}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
          <button
            type="button"
            disabled={pending || isSelf}
            title={isSelf ? "You can't lock your own account" : undefined}
            onClick={toggleLocked}
            style={{ ...accessBtn(locked, "#dc2626"), opacity: isSelf ? 0.5 : 1 }}
          >
            {locked ? "Unlock" : "Lock"}
          </button>
          <button
            type="button"
            disabled={pending || isSelf}
            title={isSelf ? "You can't disable your own account" : undefined}
            onClick={toggleDisabled}
            style={{ ...accessBtn(disabled, "#6b7280"), opacity: isSelf ? 0.5 : 1 }}
          >
            {disabled ? "Enable" : "Disable"}
          </button>
        </div>
      </td>
    </tr>
  );
}
