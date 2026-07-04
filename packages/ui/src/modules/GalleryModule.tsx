import type { GalleryContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function GalleryModule({
  content,
  variant,
}: { content: GalleryContent; variant?: StyleVariant | null }) {
  return (
    <section className={cn("mx-auto max-w-[960px] p-10", cardClasses(variant))}>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.images.length === 0 ? (
        <p className="text-muted-foreground">No images yet.</p>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${content.columns}, minmax(0, 1fr))` }}
        >
          {content.images.map((img) => (
            <figure key={img.id} className="m-0">
              <img
                src={img.url}
                alt={img.alt ?? img.caption ?? ""}
                className="block aspect-square w-full rounded-[12px] object-cover"
              />
              {img.caption && (
                <figcaption className="mt-1 text-[13px] text-muted-foreground">
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
