import type { CSSProperties } from "react";
import { ModuleRenderer, type RenderableSection } from "./ModuleRenderer";

export const GRID_COLUMNS = 12;
const MIN_SPAN = 3;

/** A section as the public page receives it: renderable + its stored grid width. */
export interface GridSection extends RenderableSection {
  id: string;
  /** `sections.width` — columns out of 12. Missing/invalid means full width. */
  width?: number | null;
}

const clampSpan = (w: number | null | undefined): number => {
  if (typeof w !== "number" || !Number.isFinite(w)) return GRID_COLUMNS;
  return Math.min(GRID_COLUMNS, Math.max(MIN_SPAN, Math.round(w)));
};

/**
 * Packs sections into rows of 12 columns, in order, and returns the span each
 * one actually renders at. When the next section doesn't fit the current row,
 * the row's last section is stretched to close it. Every row is therefore
 * full, so the grid's hairlines never leave an empty hole in the drawing.
 */
export function packSpans(widths: Array<number | null | undefined>): number[] {
  const spans = widths.map(clampSpan);
  let rowStart = 0;
  let used = 0;
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i] as number;
    if (used + span > GRID_COLUMNS) {
      // Close the previous row by stretching its last cell.
      spans[i - 1] = (spans[i - 1] as number) + (GRID_COLUMNS - used);
      rowStart = i;
      used = 0;
    }
    used += span;
    if (used === GRID_COLUMNS) {
      rowStart = i + 1;
      used = 0;
    }
  }
  if (used > 0 && rowStart < spans.length) {
    const last = spans.length - 1;
    spans[last] = (spans[last] as number) + (GRID_COLUMNS - used);
  }
  return spans;
}

/**
 * The published page's section grid. Every section sits in a cell of one
 * 12-column grid; the active site style draws the grid's rules. Below the
 * tablet breakpoint every cell is full width (see `.site-cell` in globals.css).
 */
export function SiteSections({ sections }: { sections: GridSection[] }) {
  const spans = packSpans(sections.map((s) => s.width));
  return (
    <div className="site-grid">
      {sections.map((s, i) => (
        <div
          key={s.id}
          className="site-cell @container"
          data-module-cell={s.type}
          style={{ "--w": spans[i] } as CSSProperties}
        >
          <ModuleRenderer
            section={{ type: s.type, content: s.content, style_variant: s.style_variant }}
          />
        </div>
      ))}
    </div>
  );
}
