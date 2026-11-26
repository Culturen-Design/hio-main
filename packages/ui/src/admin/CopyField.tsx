"use client";

import { useRef } from "react";
import { cn } from "../cn";
import { Button } from "./Button";
import { useToast } from "./toast/Toast";

/**
 * A read-only value (a page URL) with a Copy button. Clipboard writes can be
 * refused (permissions, older browsers); then the text is selected so the user
 * can copy it by hand, and the toast says so.
 */
export function CopyField({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const toast = useToast();
  const textRef = useRef<HTMLSpanElement>(null);

  const selectText = () => {
    const el = textRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ kind: "success", message: "Link copied." });
    } catch {
      selectText();
      toast({ kind: "success", message: "Link selected — press Ctrl+C (⌘C) to copy." });
    }
  };

  return (
    <span className={cn("inline-flex max-w-full min-w-0 items-center gap-2", className)}>
      <span
        ref={textRef}
        className="min-w-0 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
        title={value}
      >
        {value}
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={copy} aria-label={`Copy ${value}`}>
        {label}
      </Button>
    </span>
  );
}
