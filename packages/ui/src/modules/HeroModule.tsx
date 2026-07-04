import type { HeroContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function HeroModule({
  content,
  variant,
}: { content: HeroContent; variant?: StyleVariant | null }) {
  return (
    <section className={cn("px-6 py-14 text-center", cardClasses(variant))}>
      {content.eyebrow && (
        <p className="m-0 text-xs tracking-[1px] text-muted-foreground uppercase">
          {content.eyebrow}
        </p>
      )}
      <h1
        className={cn(
          "my-2 text-4xl leading-[1.1] sm:text-5xl",
          headingClasses(variant) || "font-semibold",
        )}
      >
        {content.headline}
      </h1>
      {content.subheadline && (
        <p className="mx-auto max-w-[560px] text-lg text-muted-foreground">{content.subheadline}</p>
      )}
      {content.cta_label && content.cta_url && (
        <a
          href={content.cta_url}
          className="mt-5 inline-block rounded-[8px] bg-primary px-6 py-3 font-semibold text-primary-foreground no-underline"
        >
          {content.cta_label}
        </a>
      )}
    </section>
  );
}
