import type { BioContent } from "@hio/content-model";
import type { StyleVariant } from "../style";

export function BioModule({ content }: { content: BioContent; variant?: StyleVariant | null }) {
  return (
    <section
      style={{
        padding: "2.5rem 1.5rem",
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        gap: "1.5rem",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {content.photo_url && (
        // biome-ignore lint/a11y/useAltText: alt is provided via photo_alt
        <img
          src={content.photo_url}
          alt={content.photo_alt ?? ""}
          style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 16 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 240 }}>
        <h2 style={{ marginTop: 0 }}>{content.title}</h2>
        <p style={{ whiteSpace: "pre-wrap", color: "#374151", lineHeight: 1.6 }}>{content.body}</p>
      </div>
    </section>
  );
}
