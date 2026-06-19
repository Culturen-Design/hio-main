import type { LinksContent, StyleVariant } from "@hio/content-model";

export function LinksModule({ content }: { content: LinksContent; variant?: StyleVariant | null }) {
  return (
    <section style={{ padding: "2.5rem 1.5rem", maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>{content.title}</h2>
      {content.items.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No links yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${content.columns}, minmax(0, 1fr))`,
            gap: "0.75rem",
          }}
        >
          {content.items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              style={{
                display: "block",
                padding: "0.9rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                textDecoration: "none",
                color: "#111827",
              }}
            >
              <span style={{ fontWeight: 600 }}>
                {item.icon ? `${item.icon} ` : ""}
                {item.title}
              </span>
              {item.description && (
                <span style={{ display: "block", fontSize: 13, color: "#6b7280" }}>
                  {item.description}
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
