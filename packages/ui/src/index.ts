/**
 * @hio/ui — shared design system (shadcn + tokens + section renderers).
 *
 * M2 brings in: the design tokens + shadcn primitives and the SectionHero pattern
 * from exploration/hio-space-poli (the visual quality bar), plus the 9 module
 * renderers ported from exploration/hio-builder, restyled to the token system.
 *
 * For now: the `cn` class-merge helper (seeded from hio-space-poli src/lib/utils.ts).
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
