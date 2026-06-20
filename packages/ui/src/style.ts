/**
 * Presentation-only style variants a section may render with.
 *
 * Lives in `@hio/ui` (not `@hio/content-model`) by the M3 seam-freeze decision
 * (2026-06-20): the content seam stays presentation-free. Theme/styling is a UI
 * concern resolved next to the active provider. Mirrors the `style_variant`
 * column's allowed values; the AI engine treats `style_variant` as a protected
 * field (it is not editable via chat).
 */
export type StyleVariant = "minimal" | "bold" | "outlined" | "filled";
