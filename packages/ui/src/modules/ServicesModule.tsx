import type { ServicesContent } from "@hio/content-model";
import type { StyleVariant } from "../style";

export function ServicesModule({
  content,
}: { content: ServicesContent; variant?: StyleVariant | null }) {
  return (
    <section style={{ padding: "2.5rem 1.5rem", maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>{content.title}</h2>
      {content.items.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No services yet.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.75rem" }}>
          {content.items.map((item) => (
            <li
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.9rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: "#111827" }}>{item.name}</span>
                {item.description && (
                  <span style={{ display: "block", fontSize: 14, color: "#374151" }}>
                    {item.description}
                  </span>
                )}
              </div>
              {item.price && (
                <span style={{ whiteSpace: "nowrap", fontWeight: 600, color: "#111827" }}>
                  {item.price}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
