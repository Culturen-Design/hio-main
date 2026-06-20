import type { HeroContent } from "@hio/content-model";
import type { StyleVariant } from "../style";

export function HeroModule({ content }: { content: HeroContent; variant?: StyleVariant | null }) {
  return (
    <section style={{ padding: "3.5rem 1.5rem", textAlign: "center" }}>
      {content.eyebrow && (
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: 12,
            color: "#6b7280",
            margin: 0,
          }}
        >
          {content.eyebrow}
        </p>
      )}
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0", lineHeight: 1.1 }}>
        {content.headline}
      </h1>
      {content.subheadline && (
        <p style={{ color: "#6b7280", fontSize: "1.15rem", maxWidth: 560, margin: "0 auto" }}>
          {content.subheadline}
        </p>
      )}
      {content.cta_label && content.cta_url && (
        <a
          href={content.cta_url}
          style={{
            display: "inline-block",
            marginTop: "1.25rem",
            padding: "0.7rem 1.4rem",
            borderRadius: 8,
            background: "#111827",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          {content.cta_label}
        </a>
      )}
    </section>
  );
}
