import type { HeroContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function HeroModule({
  content,
  variant,
}: { content: HeroContent; variant?: StyleVariant | null }) {
  return (
    <section data-module="hero" className={cn("text-center", cardClasses(variant))}>
      {content.eyebrow && <p className="bp-eyebrow site-label m-0">{content.eyebrow}</p>}
      <h1
        className={cn(
          "mx-auto my-3 max-w-[22ch] text-4xl leading-[1.1] [overflow-wrap:anywhere] [text-wrap:balance] sm:text-5xl",
          headingClasses(variant) || "font-semibold",
        )}
      >
        {content.headline}
      </h1>
      {content.subheadline && (
        <p className="mx-auto mt-0 mb-0 max-w-[560px] text-lg text-muted-foreground">
          {content.subheadline}
        </p>
      )}
      {content.supporting_text && (
        <p className="mx-auto mt-3 mb-0 max-w-[560px] leading-relaxed text-muted-foreground">
          {content.supporting_text}
        </p>
      )}
      {content.cta_label && content.cta_url && (
        <a href={content.cta_url} className="site-button mt-6">
          {content.cta_label}
        </a>
      )}
      {/* The picture runs to the cell's sides and foot: no frame (rule 4). */}
      {content.image_url && (
        <img
          src={content.image_url}
          alt={content.image_alt ?? ""}
          className="site-bleed aspect-[3/2] object-cover @2xl:aspect-[5/2]"
        />
      )}
    </section>
  );
}
