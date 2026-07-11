"use client";

import { FREE_MODULE_TYPES, type ModuleType } from "@hio/content-model";
import { cn } from "@hio/ui";
import {
  Badge,
  ConfirmDialog,
  Spinner,
  buttonClasses,
  toastFromResult,
  useToast,
} from "@hio/ui/admin";
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

const cell = "border-b border-border px-3 py-2.5 align-top";

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
    <table className="w-full min-w-[640px] border-collapse text-sm">
      <thead>
        <tr className="bg-muted text-left text-xs text-muted-foreground">
          <th className={cn(cell, "font-medium")}>User</th>
          <th className={cn(cell, "font-medium")}>Tier</th>
          <th className={cn(cell, "font-medium")}>Extra modules (overrides)</th>
          <th className={cn(cell, "font-medium")}>Access</th>
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
  const [confirmingDowngrade, setConfirmingDowngrade] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();

  // A single save pattern for every control in this row: fire immediately on
  // change, show a spinner while pending, then a toast with the result —
  // no separate "Save" button anywhere (tier used to autosave while overrides
  // needed an explicit click; this closes that inconsistency).
  const run = (fn: () => Promise<ActionResult>, savedText: string) => {
    start(async () => {
      const res = await fn();
      const t = toastFromResult(res, savedText);
      if (t) toast(t);
    });
  };

  const toggleModule = (type: string) => {
    const next = new Set(selected);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setSelected(next);
    run(() => setModuleOverrides(row.userId, [...next] as ModuleType[]), "Overrides saved");
  };

  const applyTier = (next: "free" | "paid") => {
    setTierState(next);
    run(() => setTier(row.userId, next), "Tier updated");
  };

  const changeTier = (next: string) => {
    // Downgrading a paid user silently walls off any paid-only modules
    // already on their page — confirm before it's irreversible-feeling.
    // (The controlled <select> keeps its old value until confirmed.)
    if (row.tier === "paid" && next === "free") {
      setConfirmingDowngrade(true);
      return;
    }
    applyTier(next as "free" | "paid");
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
      <td className={cell}>
        <div className="flex items-center gap-1.5 font-semibold">
          {row.slug ? `/${row.slug}` : "—"}
          {row.isAdmin && <Badge tone="primary">admin</Badge>}
          {isSelf && <Badge>you</Badge>}
          {pending && <Spinner className="size-3 text-muted-foreground" label="Saving…" />}
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">{row.userId}</div>
      </td>

      <td className={cell}>
        <select
          value={tier}
          disabled={pending}
          onChange={(e) => changeTier(e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2 text-sm disabled:opacity-50"
        >
          <option value="free">free</option>
          <option value="paid">paid</option>
        </select>
        <ConfirmDialog
          open={confirmingDowngrade}
          title="Downgrade to free?"
          description="Any paid-only modules already on this user's page will stop being editable until they're upgraded again."
          confirmLabel="Downgrade"
          destructive
          onConfirm={() => {
            setConfirmingDowngrade(false);
            applyTier("free");
          }}
          onCancel={() => setConfirmingDowngrade(false)}
        />
      </td>

      <td className={cell}>
        <div className="flex flex-wrap gap-x-3.5 gap-y-2">
          {extraModules.map((type) => (
            <label key={type} className="inline-flex items-center gap-1 text-[13px]">
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

      <td className={cell}>
        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button"
            disabled={pending || isSelf}
            title={isSelf ? "You can't lock your own account" : undefined}
            onClick={toggleLocked}
            className={cn(
              buttonClasses(locked ? "destructive" : "secondary", "sm"),
              isSelf && "opacity-50",
            )}
          >
            {locked ? "Unlock" : "Lock"}
          </button>
          <button
            type="button"
            disabled={pending || isSelf}
            title={isSelf ? "You can't disable your own account" : undefined}
            onClick={toggleDisabled}
            className={cn(
              buttonClasses(disabled ? "primary" : "secondary", "sm"),
              isSelf && "opacity-50",
            )}
          >
            {disabled ? "Enable" : "Disable"}
          </button>
        </div>
      </td>
    </tr>
  );
}
