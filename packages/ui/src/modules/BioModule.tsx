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
      data-module="bio"
      className={cn(
        "mx-auto flex max-w-[720px] flex-wrap items-start gap-6 p-6 sm:p-10",
        cardClasses(variant),
      )}
    >
      {content.photo_url && (
        <div className="bp-offset shrink-0">
          <img
            src={content.photo_url}
            alt={content.photo_alt ?? ""}
            className="h-[140px] w-[140px] rounded-[28px] border border-border object-cover"
          />
        </div>
      )}
      <div className="min-w-[min(240px,100%)] flex-1">
        {content.tagline && (
          <p className="bp-eyebrow m-0 mb-1 text-xs text-muted-foreground uppercase tracking-[1px]">
            {content.tagline}
          </p>
        )}
        <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{content.body}</p>
        {content.facts && content.facts.length > 0 && (
          <dl className="mt-5 grid gap-2.5">
            {content.facts.map((f) => (
              <div key={f.id} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                <dt className="shrink-0 text-muted-foreground text-xs uppercase tracking-wide">
                  {f.label}
                </dt>
                <span className="bp-leader" aria-hidden />
                <dd className="m-0 min-w-0 font-semibold text-foreground [overflow-wrap:anywhere]">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
