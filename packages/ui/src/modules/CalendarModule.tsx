import type { CalendarContent } from "@hio/content-model";
import type { StyleVariant } from "../style";
import { cardClasses } from "../variant";
import { SectionHeader, countLabel } from "./SectionHeader";

/** Pinned to "en-US" (not the runtime default) so a server-rendered date
 *  string can't mismatch the client's own default locale on hydration — this
 *  surfaced as a real hydration-mismatch warning during live verification,
 *  once a real (non-empty) event exercised this path for the first time. */
const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

/** Day number + month abbreviation for the calendar date-badge. Same "en-US"
 *  pin as `fmtDate` above, for the same reason — exported for a colocated
 *  test; falls back to the raw string for an invalid date. */
export const splitDate = (iso: string): { day: string; month: string } => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { day: iso, month: "" };
  return {
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
};

export function CalendarModule({
  content,
  variant,
}: {
  content: CalendarContent;
  variant?: StyleVariant | null;
}) {
  // Hide past events unless show_past is set. Compare against today's date string.
  const today = new Date().toISOString().slice(0, 10);
  const events = [...content.events]
    .filter((e) => content.show_past || e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section data-module="calendar" className={cardClasses(variant)}>
      <SectionHeader
        count={countLabel(events.length, "event", "events")}
        title={content.title}
        intro={content.intro}
        variant={variant}
      />
      {events.length === 0 ? (
        <p className="mt-4 mb-0 text-muted-foreground">No upcoming events.</p>
      ) : (
        // One event per row of the section's grid. The date is type, not a
        // box (rule 6): a large day over a small month label.
        <ul className="site-items">
          {events.map((e) => {
            const { day, month } = splitDate(e.date);
            return (
              <li key={e.id} className="flex min-w-0 gap-5">
                <time dateTime={e.date} className="flex w-12 shrink-0 flex-col">
                  <span
                    aria-hidden="true"
                    className="font-semibold text-2xl text-foreground leading-none"
                  >
                    {day}
                  </span>
                  {month && (
                    <span aria-hidden="true" className="site-label mt-1">
                      {month}
                    </span>
                  )}
                  <span className="sr-only">{fmtDate(e.date)}</span>
                </time>
                <div className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="font-semibold">
                    {e.url ? (
                      <a href={e.url} className="text-foreground underline underline-offset-2">
                        {e.title}
                      </a>
                    ) : (
                      e.title
                    )}
                  </span>
                  {(e.time || e.location) && (
                    <span className="block text-muted-foreground text-sm">
                      {[e.time, e.location].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {e.description && (
                    <span className="mt-1 block text-muted-foreground text-sm">
                      {e.description}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
