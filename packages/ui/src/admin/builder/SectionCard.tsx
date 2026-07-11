"use client";

import type { DragEvent, ReactNode } from "react";
import { cn } from "../../cn";
import { buttonClasses } from "../Button";

/**
 * One section on the canvas: a chrome bar (drag handle, type label, ghost
 * Edit — manual editing is deliberately demoted — and Delete) over the live
 * module preview or the inline editor (children decide which).
 */
export function SectionCard({
  type,
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
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "overflow-hidden rounded-xl border bg-background",
        isOver ? "border-primary" : "border-border",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Drag to reorder ${type}`}
            draggable={!disabled}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="cursor-grab border-none bg-transparent p-0 text-sm text-muted-foreground leading-none"
          >
            ⠿
          </button>
          <span className="text-xs font-semibold text-muted-foreground uppercase">{type}</span>
        </div>
        <div className="flex gap-1">
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
      {children}
    </div>
  );
}
