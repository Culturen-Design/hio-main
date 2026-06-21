import type { ContactContent } from "@hio/content-model";
import type { StyleVariant } from "../style";

export function ContactModule({
  content,
}: { content: ContactContent; variant?: StyleVariant | null }) {
  const rows: Array<{ label: string; value: string; href?: string }> = [];
  if (content.email)
    rows.push({ label: "Email", value: content.email, href: `mailto:${content.email}` });
  if (content.phone)
    rows.push({ label: "Phone", value: content.phone, href: `tel:${content.phone}` });
  if (content.location) rows.push({ label: "Location", value: content.location });

  return (
    <section style={{ padding: "2.5rem 1.5rem", maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>{content.title}</h2>
      {content.intro && <p style={{ color: "#374151", lineHeight: 1.6 }}>{content.intro}</p>}
      {rows.length > 0 && (
        <dl style={{ display: "grid", gap: "0.5rem", margin: "1.25rem 0 0" }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", gap: "0.75rem" }}>
              <dt style={{ width: 80, color: "#6b7280", fontSize: 14 }}>{r.label}</dt>
              <dd style={{ margin: 0 }}>
                {r.href ? (
                  <a href={r.href} style={{ color: "#111827" }}>
                    {r.value}
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
