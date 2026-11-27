import type { GalleryContent } from "@hio/content-model";
import type { CSSProperties } from "react";
import type { StyleVariant } from "../style";
import { cardClasses } from "../variant";
import { SectionHeader, countLabel } from "./SectionHeader";

export function GalleryModule({
  content,
  variant,
}: { content: GalleryContent; variant?: StyleVariant | null }) {
  return (
    <section data-module="gallery" className={cardClasses(variant)}>
      <SectionHeader
        count={countLabel(content.images.length, "image", "images")}
        title={content.title}
        intro={content.intro}
        variant={variant}
      />
      {content.images.length === 0 ? (
        <p className="mt-4 mb-0 text-muted-foreground">No images yet.</p>
      ) : (
        // Each image is a cell: the picture runs to the cell's edges and the
        // caption sits under it in the cell. No frame (rule 4).
        <ul
          className="site-items grid-cols-2 @lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ "--cols": content.columns ?? 3 } as CSSProperties}
        >
          {content.images.map((img) => (
            <li key={img.id}>
              <figure className="m-0">
                <img
                  src={img.url}
                  alt={img.alt ?? ""}
                  className="site-media aspect-square object-cover"
                />
                {img.caption && (
                  <figcaption className="text-muted-foreground text-xs leading-snug">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
