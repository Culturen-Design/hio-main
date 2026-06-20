import type { CalendarContent } from "@hio/content-model";
import type { StyleVariant } from "../style";

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

export function CalendarModule({
  content,
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
    <section style={{ padding: "2.5rem 1.5rem", maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>{content.title}</h2>
      {events.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No upcoming events.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.75rem" }}>
          {events.map((e) => (
            <li
              key={e.id}
              style={{
                display: "flex",
                gap: "1rem",
                padding: "0.9rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
              }}
            >
              <div style={{ minWidth: 92, fontWeight: 600, color: "#111827" }}>
                {fmtDate(e.date)}
                {e.time && (
                  <span style={{ display: "block", fontSize: 13, color: "#6b7280" }}>{e.time}</span>
                )}
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>
                  {e.url ? (
                    <a href={e.url} style={{ color: "#111827" }}>
                      {e.title}
                    </a>
                  ) : (
                    e.title
                  )}
                </span>
                {e.location && (
                  <span style={{ display: "block", fontSize: 13, color: "#6b7280" }}>
                    📍 {e.location}
                  </span>
                )}
                {e.description && (
                  <span style={{ display: "block", fontSize: 14, color: "#374151" }}>
                    {e.description}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
