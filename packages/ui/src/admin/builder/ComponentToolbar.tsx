"use client";

import type { DragEvent } from "react";
import { cn } from "../../cn";
import { ModuleIcon, moduleDescription } from "./moduleMeta";

/** The drag payload type for a component dragged out of the toolbar. */
export const COMPONENT_DRAG_TYPE = "application/x-hio-module";

/**
 * The list of components a site may add, from the schema provider's palette.
 * Click one to add it at the end of the page, or drag it onto the canvas to
 * drop it before a section. Rendered in the builder's left pane at `lg` and
 * inside the "Add a section" disclosure on smaller screens.
 */
export function ComponentList({
  palette,
  paletteError,
  disabled,
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  palette: { type: string; label: string }[];
  paletteError?: string | null;
  disabled: boolean;
  onAdd: (type: string) => void;
  onDragStart?: (type: string) => void;
  onDragEnd?: () => void;
}) {
  if (paletteError) {
    return (
      <p className="m-0 px-3 py-2 text-xs text-destructive">
        Sections can't be added right now. Please reload the page or contact support.
      </p>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-2">
      {palette.map((m) => {
        const description = moduleDescription(m.type);
        return (
          <li key={m.type}>
            <button
              type="button"
              disabled={disabled}
              draggable={!disabled && Boolean(onDragStart)}
              onDragStart={(e: DragEvent) => {
                e.dataTransfer.setData(COMPONENT_DRAG_TYPE, m.type);
                e.dataTransfer.effectAllowed = "copy";
                onDragStart?.(m.type);
              }}
              onDragEnd={onDragEnd}
              onClick={() => onAdd(m.type)}
              title={`Add ${m.label} at the end, or drag it into place`}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left",
                "hover:bg-muted disabled:opacity-50",
                onDragStart && !disabled && "cursor-grab active:cursor-grabbing",
              )}
            >
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                <ModuleIcon type={m.type} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{m.label}</span>
                {description ? (
                  <span className="block text-xs leading-snug text-muted-foreground">
                    {description}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
