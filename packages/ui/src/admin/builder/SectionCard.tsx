"use client";

import type { CSSProperties, DragEvent, ReactNode } from "react";
import { cn } from "../../cn";
import { buttonClasses } from "../Button";

/** Width presets offered in the card, filtered to the module's allowed range. */
const WIDTH_PRESETS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 12, label: "Full width" },
  { value: 8, label: "Two thirds" },
  { value: 6, label: "Half" },
  { value: 4, label: "One third" },
];

/** The width choices for a module's allowed `[min, max]` range, plus the
 *  current value if it's a custom one (e.g. 9 columns set elsewhere). */
export function widthOptions(
  range: [number, number] | undefined,
  current: number,
): Array<{ value: number; label: string }> {
  if (!range) return [];
  const [min, max] = range;
  const opts = WIDTH_PRESETS.filter((o) => o.value >= min && o.value <= max);
  if (!opts.some((o) => o.value === current)) {
    opts.push({ value: current, label: `${current} of 12 columns` });
    opts.sort((a, b) => b.value - a.value);
  }
  return opts;
}

/**
 * One section on the canvas: a chrome bar (drag handle, name, move up/down,
 * width, ghost Edit — manual editing is deliberately demoted — and Delete)
 * over the live preview or the inline editor (children decide which). The
 * card spans its share of the canvas grid, like the published page.
 */
export function SectionCard({
  type,
  label,
  span = 12,
  width = 12,
  widthRange,
  onSetWidth,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  editing,
  disabled,
  isDragging,
  isOver,
  onEditToggle,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  children,
}: {
  type: string;
  /** Human name from the schema provider ("Testimonials"); falls back to type. */
  label?: string;
  span?: number;
  width?: number;
  widthRange?: [number, number];
  onSetWidth?: (width: number) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  editing: boolean;
  disabled: boolean;
  isDragging: boolean;
  isOver: boolean;
  onEditToggle: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  children: ReactNode;
}) {
  const name = label ?? type;
  const options = onSetWidth ? widthOptions(widthRange, width) : [];
  const iconBtn =
    "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30";

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ "--span": span } as CSSProperties}
      className={cn(
        "col-span-12 flex min-w-0 flex-col overflow-hidden rounded-xl border bg-background md:[grid-column:span_var(--span)/span_var(--span)]",
        isOver ? "border-primary" : "border-border",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Drag to reorder ${name}`}
            title="Drag to reorder"
            draggable={!disabled}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={cn(iconBtn, "cursor-grab")}
          >
            ⠿
          </button>
          <button
            type="button"
            className={iconBtn}
            disabled={disabled || !canMoveUp}
            onClick={onMoveUp}
            aria-label={`Move ${name} up`}
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className={iconBtn}
            disabled={disabled || !canMoveDown}
            onClick={onMoveDown}
            aria-label={`Move ${name} down`}
            title="Move down"
          >
            ↓
          </button>
          <span className="ml-1 truncate text-xs font-semibold text-foreground">{name}</span>
        </div>
        <div className="flex items-center gap-1">
          {options.length > 1 && (
            <select
              aria-label={`Width of ${name}`}
              title="Width on the page (phones always show full width)"
              value={width}
              disabled={disabled}
              onChange={(e) => onSetWidth?.(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-background px-1.5 text-xs"
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className={buttonClasses("ghost", "sm")}
            disabled={disabled}
            onClick={onEditToggle}
          >
            {editing ? "Close" : "Edit"}
          </button>
          <button
            type="button"
            className={cn(buttonClasses("ghost", "sm"), "text-destructive hover:bg-destructive/10")}
            disabled={disabled}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
