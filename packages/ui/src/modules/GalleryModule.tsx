import type { GalleryContent } from "@hio/content-model";
import type { CSSProperties } from "react";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function GalleryModule({
  content,
  variant,
}: { content: GalleryContent; variant?: StyleVariant | null }) {
  return (
    <section
      data-module="gallery"
      className={cn("mx-auto max-w-[960px] p-6 sm:p-10", cardClasses(variant))}
    >
      <p className="bp-count" aria-hidden>
        {content.images.length} {content.images.length === 1 ? "image" : "images"}
      </p>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.intro && (
        <p className="mt-1 mb-5 max-w-[560px] leading-relaxed text-muted-foreground">
          {content.intro}
        </p>
      )}
      {content.images.length === 0 ? (
        <p className="text-muted-foreground">No images yet.</p>
      ) : (
        <div
          className="grid grid-cols-2 gap-3 @lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ "--cols": content.columns ?? 3 } as CSSProperties}
        >
          {content.images.map((img) => (
            <figure key={img.id} className="m-0 min-w-0">
              <div className="bp-frame bp-offset rounded-[14px] border border-border bg-background p-1.5">
                <img
                  src={img.url}
                  alt={img.alt ?? ""}
                  className="block aspect-square w-full rounded-[8px] object-cover"
                />
              </div>
              {img.caption && (
                <figcaption className="mt-1.5 text-muted-foreground text-sm">
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
