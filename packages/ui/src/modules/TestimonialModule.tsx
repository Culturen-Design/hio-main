import type { TestimonialContent } from "@hio/content-model";
import type { StyleVariant } from "../style";

export function TestimonialModule({
  content,
}: { content: TestimonialContent; variant?: StyleVariant | null }) {
  return (
    <section style={{ padding: "2.5rem 1.5rem", maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>{content.title}</h2>
      {content.items.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No testimonials yet.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "1rem" }}>
          {content.items.map((t) => (
            <li
              key={t.id}
              style={{ padding: "1.1rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: 12 }}
            >
              <blockquote style={{ margin: 0, color: "#111827", lineHeight: 1.55 }}>
                “{t.quote}”
              </blockquote>
              <div
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  alignItems: "center",
                  marginTop: "0.75rem",
                }}
              >
                {t.avatar_url && (
                  <img
                    src={t.avatar_url}
                    alt={t.author}
                    style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                  />
                )}
                <div style={{ fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{t.author}</span>
                  {t.role && <span style={{ color: "#6b7280" }}> · {t.role}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
