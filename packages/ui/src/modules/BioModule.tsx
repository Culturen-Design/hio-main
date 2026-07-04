import type { BioContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function BioModule({
  content,
  variant,
}: { content: BioContent; variant?: StyleVariant | null }) {
  return (
    <section
      className={cn(
        "mx-auto flex max-w-[720px] flex-wrap items-start gap-6 p-10",
        cardClasses(variant),
      )}
    >
      {content.photo_url && (
        // biome-ignore lint/a11y/useAltText: alt is provided via photo_alt
        <img
          src={content.photo_url}
          alt={content.photo_alt ?? ""}
          className="h-[140px] w-[140px] rounded-[28px] border border-border object-cover"
        />
      )}
      <div className="min-w-[240px] flex-1">
        <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{content.body}</p>
      </div>
    </section>
  );
}
