# Published-page design rules

These rules hold for every module and every site style on a published page
(Self-Serve `/[slug]`, Studio `/sites/[slug]`) and in the builder's section
previews. A style changes colour, type and the margin pattern. It never changes
structure. The CSS lives in `packages/ui/src/globals.css`; the shared section
header is `packages/ui/src/modules/SectionHeader.tsx`.

Owner direction (2026-11-27): "think systematic about design and apply rules
everywhere". The specific complaints this answers: cards drawn as a border
inside a border, inset from the section's own edge; offset "shadow" outlines;
dashed lines under gallery images; lines poking out at the sheet's corners;
a background pattern that doesn't line up with the page.

| # | Rule | How it is built |
|---|------|-----------------|
| 1 | **One kind of line.** Every line is 1px, solid, one colour (`--line`), and it is the edge of a cell. No dashed or dotted lines, shadows, offset outlines, frames or mats. | The page grid's 1px gaps and the items grid's 1px gaps are the only lines. |
| 2 | **Cells divide, boxes don't nest.** The page is a grid of section cells. A section's items (services, links, images, testimonials, events, contact rows, bio facts) are cells of a grid that runs to the section's own edges and shares them. Nothing draws a box inside a cell. | `.site-items` on the list. It adds one top line; the cell provides the sides and foot. An unfilled last row stays empty paper. |
| 3 | **One inset.** Content sits `--pad` from a section's sides. Items use the same side inset (`--pad-item` is only their top and bottom), so all text in a column starts on one left edge. Modules carry no padding classes. | Set once in CSS for `[data-module]` and `.site-items > *`. |
| 4 | **Images run to the edge of the cell they sit in.** No frame around a picture. | `.site-media` (top and sides of an item), `.site-bleed` (sides and foot of a section, e.g. the hero image). |
| 5 | **The grid is square; Rounding is for what you touch and look at.** Section cells and item cells share their lines, so they never round. The site's Rounding setting (Sharp / Soft / Round) applies to buttons and pictures only. A portrait photo may be fully round (`rounded-full`). | `--site-radius` (pictures) and `--site-radius-button` (buttons), set by `themeToStyle`. Modules use no `rounded-*` classes. |
| 6 | **Labels are type, not boxes.** Small, uppercase, muted, tracked. | `.site-label` (contact rows, bio facts, event month, hero eyebrow). |
| 7 | **Buttons are a flat accent fill.** No shadow or outline. The one exception is the button's own edge on the dark contact panel, for contrast. | `.site-button`. |
| 8 | **The page pattern lines up with the sheet.** | The pattern is drawn by the sheet, anchored on its left border; the sheet's width snaps to 8n + 1px, so pinstripes fall exactly on both side borders. |
| 9 | **Width is one token.** The site's Page width (Classic, Full screen, Wide 5%, Comfortable 10%, Roomy 15%, Narrow 20%) only sets the side margin (`--margin`) and the sheet's cap (`--sheet-max`); the grid, pattern and sections follow. Phones keep a 16px margin (none for Full screen). Running text stays near 65 characters a line at any width; headings and pictures use the full cell. | `site-width-<value>` on the page wrapper. `max-width: 65ch` on paragraphs, quotes and prose list items. Per-section widths (full, ⅔, ½, ⅓) divide whatever width the page has. |

## Turning a theme into page styling
Every published page, custom domain and preview gets its wrapper class and
inline tokens from one helper, `sitePageProps(theme)` in `packages/ui/src/theme.ts`.
Never build `site-style-…` class strings by hand. A new theme setting is: a
type and options list in `theme.ts`, its parse and curated-value handling, a
class or token in `sitePageProps`/`themeToStyle`, CSS here, and a picker in
the shared `SiteLookForm` (`@hio/ui/admin`), which both apps use.

## Adding or changing a module
- Start with `<SectionHeader>` (count, title, intro). Put any list in `.site-items`.
- Don't add borders, shadows, radii or padding classes. If a module seems to need
  one, the rule is missing something: change the rule here and in the CSS, for
  every module at once.
- A style-variant (`outlined` / `filled` / `bold`) may change fill or heading
  weight. Its border never shows inside the grid.
