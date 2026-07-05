import type { CalendarContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

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
    <section
      data-module="calendar"
      className={cn("mx-auto max-w-[720px] p-10", cardClasses(variant))}
    >
      <p className="bp-count" aria-hidden>
        {events.length} {events.length === 1 ? "event" : "events"}
      </p>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {events.length === 0 ? (
        <p className="text-muted-foreground">No upcoming events.</p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {events.map((e) => {
            const { day, month } = splitDate(e.date);
            return (
              <li key={e.id} className="flex gap-4 rounded-[12px] border border-border px-4 py-3.5">
                <div
                  aria-label={fmtDate(e.date)}
                  className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-card border border-border bg-muted text-center"
                >
                  <span className="font-bold text-foreground text-xl leading-none">{day}</span>
                  {month && (
                    <span className="mt-0.5 text-[10px] text-muted-foreground tracking-wide">
                      {month}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">
                    {e.url ? (
                      <a href={e.url} className="text-foreground">
                        {e.title}
                      </a>
                    ) : (
                      e.title
                    )}
                  </span>
                  {e.time && (
                    <span className="block text-[13px] text-muted-foreground">{e.time}</span>
                  )}
                  {e.location && (
                    <span className="block text-[13px] text-muted-foreground">📍 {e.location}</span>
                  )}
                  {e.description && (
                    <span className="block text-sm text-muted-foreground">{e.description}</span>
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
