import type { GalleryContent } from "@hio/content-model";
import type { StyleVariant } from "../style";

export function GalleryModule({
  content,
}: { content: GalleryContent; variant?: StyleVariant | null }) {
  return (
    <section style={{ padding: "2.5rem 1.5rem", maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>{content.title}</h2>
      {content.images.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No images yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${content.columns}, minmax(0, 1fr))`,
            gap: "0.75rem",
          }}
        >
          {content.images.map((img) => (
            <figure key={img.id} style={{ margin: 0 }}>
              <img
                src={img.url}
                alt={img.alt ?? img.caption ?? ""}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: 12,
                  display: "block",
                }}
              />
              {img.caption && (
                <figcaption style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
