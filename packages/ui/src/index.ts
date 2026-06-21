/**
 * @hio/ui — shared design system + module renderers.
 *
 * Renderers are presentational (server-component friendly). M2.5 wires AI editing;
 * a later pass swaps inline styles for shadcn + the design tokens from hio-space-poli.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export { HeroModule } from "./modules/HeroModule";
export { BioModule } from "./modules/BioModule";
export { LinksModule } from "./modules/LinksModule";
export { CalendarModule } from "./modules/CalendarModule";
export { ContactModule } from "./modules/ContactModule";
export { ModuleRenderer, type RenderableSection } from "./modules/ModuleRenderer";
export type { StyleVariant } from "./style";
export { type SiteTheme, parseSiteTheme, themeToStyle } from "./theme";
