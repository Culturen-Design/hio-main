"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

/**
 * Confirmation on the native `<dialog>` element — `showModal()` gives us the
 * focus trap, Esc-to-cancel, and `::backdrop` for free. Esc fires `close`,
 * which we route to `onCancel`, so the `open` prop stays the single source of
 * truth.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => {
        if (open) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-background p-6 text-foreground shadow-lg backdrop:bg-foreground/40"
    >
      <h2 className="m-0 text-sm font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 mb-0 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={destructive ? "destructive" : "primary"} size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
