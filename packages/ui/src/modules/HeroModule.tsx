import type { HeroContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function HeroModule({
  content,
  variant,
}: { content: HeroContent; variant?: StyleVariant | null }) {
  return (
    <section
      data-module="hero"
      className={cn(
        "relative border-primary border-t-[3px] bg-[radial-gradient(ellipse_at_top,var(--color-muted),transparent_70%)] px-6 py-14 text-center",
        cardClasses(variant),
      )}
    >
      <span className="bp-ghost-cell" aria-hidden style={{ top: 14, left: 14 }} />
      <span className="bp-ghost-cell" aria-hidden style={{ top: 14, right: 14 }} />
      <span className="bp-ghost-cell" aria-hidden style={{ bottom: 14, left: 14 }} />
      {content.eyebrow && (
        <p className="bp-eyebrow m-0 text-xs tracking-[1px] text-muted-foreground uppercase">
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
      {content.supporting_text && (
        <p className="mx-auto mt-3 max-w-[560px] leading-relaxed text-muted-foreground">
          {content.supporting_text}
        </p>
      )}
      {content.cta_label && content.cta_url && (
        <a
          href={content.cta_url}
          className="bp-offset mt-5 inline-block rounded-[8px] bg-primary px-6 py-3 font-semibold text-primary-foreground no-underline"
        >
          {content.cta_label}
        </a>
      )}
      {content.image_url && (
        <div className="bp-offset mx-auto mt-8 max-w-[720px] rounded-[14px] border border-border bg-background p-1.5">
          <img
            src={content.image_url}
            alt={content.image_alt ?? ""}
            className="block aspect-[2/1] w-full rounded-[8px] object-cover"
          />
        </div>
      )}
    </section>
  );
}
