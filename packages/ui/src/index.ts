/**
 * @hio/ui — shared design system + module renderers.
 *
 * Renderers are presentational (server-component friendly). M2.5 wires AI editing;
 * a later pass swaps inline styles for shadcn + the design tokens from hio-space-poli.
 */
export { cn } from "./cn";
export { HeroModule } from "./modules/HeroModule";
export { BioModule } from "./modules/BioModule";
export { LinksModule } from "./modules/LinksModule";
export { CalendarModule } from "./modules/CalendarModule";
export { ContactModule } from "./modules/ContactModule";
export { ServicesModule } from "./modules/ServicesModule";
export { GalleryModule } from "./modules/GalleryModule";
export { TestimonialModule } from "./modules/TestimonialModule";
export { CustomModule } from "./modules/CustomModule";
export { ModuleRenderer, type RenderableSection } from "./modules/ModuleRenderer";
export type { StyleVariant } from "./style";
export {
  type SiteTheme,
  type RadiusPreset,
  type SiteStyle,
  type MarginPattern,
  ACCENT_SWATCHES,
  FONT_STACKS,
  RADIUS_PRESETS,
  STYLE_OPTIONS,
  MARGIN_PATTERN_OPTIONS,
  DEFAULT_THEME,
  parseSiteTheme,
  themeToStyle,
} from "./theme";
export { CollectionEditor, type FieldConfig, type FieldKind } from "./forms/CollectionEditor";
export {
  COLLECTION_FIELD_REGISTRY,
  type CollectionFieldConfig,
  cleanCollectionRows,
} from "./forms/collectionFields";
export {
  MODULE_SCALAR_FIELDS,
  type ScalarFieldKind,
  type ScalarFieldSpec,
  type ScalarFormValue,
  discoverScalarSpecs,
  initialScalarValues,
  applyScalarValues,
} from "./forms/moduleFields";
