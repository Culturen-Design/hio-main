import type { CalendarContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
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
    <section className={cn("mx-auto max-w-[720px] p-10", cardClasses(variant))}>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {events.length === 0 ? (
        <p className="text-muted-foreground">No upcoming events.</p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {events.map((e) => (
            <li key={e.id} className="flex gap-4 rounded-[12px] border border-border px-4 py-3.5">
              <div className="min-w-[92px] font-semibold text-foreground">
                {fmtDate(e.date)}
                {e.time && (
                  <span className="block text-[13px] text-muted-foreground">{e.time}</span>
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
                {e.location && (
                  <span className="block text-[13px] text-muted-foreground">📍 {e.location}</span>
                )}
                {e.description && (
                  <span className="block text-sm text-muted-foreground">{e.description}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
