/**
 * Editor-only presentation for module types: an icon, a one-line description
 * for the component toolbar, and a short summary for a collapsed section.
 * The schema provider stays the authority on *which* modules exist and their
 * labels; this only dresses them. Unknown types get a generic icon and no
 * description, so a new module still works before it gets an entry here.
 */

const ICON_PATHS: Record<string, string> = {
  hero: "M2 3h12v6H2zM4 12h8",
  bio: "M8 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 14c0-2.8 2.2-5 5-5s5 2.2 5 5",
  services: "M2 3h12M2 8h12M2 13h12M11 2v2M11 7v2M11 12v2",
  calendar: "M2 4h12v10H2zM2 7h12M5 2v3M11 2v3",
  links: "M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 0 1 4.5 9l1-1",
  contact: "M2 4h12v8H2zM2 4l6 5 6-5",
  gallery: "M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z",
  testimonial: "M3 4h10v6H7l-3 3v-3H3z",
  custom: "M2 3h12M2 6.5h12M2 10h8M2 13.5h10",
};

const DESCRIPTIONS: Record<string, string> = {
  hero: "Big headline at the top of the page",
  bio: "About you, with a photo and key facts",
  services: "What you offer, with prices",
  calendar: "Upcoming events and dates",
  links: "A list of links to elsewhere",
  contact: "Email, phone, address and hours",
  gallery: "A grid of pictures",
  testimonial: "Quotes from people you've worked with",
  custom: "Free text with headings and lists",
};

export function moduleDescription(type: string): string | undefined {
  return DESCRIPTIONS[type];
}

export function ModuleIcon({ type, className }: { type: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className ?? "size-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICON_PATHS[type] ?? "M2 2h12v12H2z"} />
    </svg>
  );
}

const LIST_FIELDS: Record<string, { key: string; one: string; many: string }> = {
  links: { key: "items", one: "link", many: "links" },
  services: { key: "items", one: "service", many: "services" },
  testimonial: { key: "items", one: "quote", many: "quotes" },
  gallery: { key: "images", one: "image", many: "images" },
  calendar: { key: "events", one: "event", many: "events" },
  bio: { key: "facts", one: "fact", many: "facts" },
};

/** One line for a collapsed section: its title (or headline) and, for list
 *  modules, how many items it holds — e.g. "My services · 3 services". */
export function sectionSummary(type: string, content: unknown): string {
  const c = (content ?? {}) as Record<string, unknown>;
  const parts: string[] = [];
  const title = typeof c.title === "string" ? c.title : c.headline;
  if (typeof title === "string" && title.trim()) parts.push(title.trim());
  const list = LIST_FIELDS[type];
  if (list) {
    const items = c[list.key];
    const n = Array.isArray(items) ? items.length : 0;
    parts.push(`${n} ${n === 1 ? list.one : list.many}`);
  }
  return parts.join(" · ");
}

/** Where a dropped toolbar component lands: before the card it's dropped on,
 *  or at the end. Returns `undefined` for "append" so callers can skip the
 *  reorder step entirely. */
export function insertIndex(dropIndex: number | null, count: number): number | undefined {
  if (dropIndex === null || dropIndex >= count) return undefined;
  return Math.max(0, dropIndex);
}
