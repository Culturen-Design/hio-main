import { cn } from "../cn";

export function Spinner({ className, label = "Working…" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle",
        className,
      )}
    />
  );
}
