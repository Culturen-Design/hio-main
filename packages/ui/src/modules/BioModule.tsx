import type { BioContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function BioModule({
  content,
  variant,
}: { content: BioContent; variant?: StyleVariant | null }) {
  return (
    <section data-module="bio" className={cardClasses(variant)}>
      <div className="flex flex-wrap items-start gap-6">
        {content.photo_url && (
          <img
            src={content.photo_url}
            alt={content.photo_alt ?? ""}
            className="h-[140px] w-[140px] shrink-0 object-cover"
          />
        )}
        <div className="min-w-[min(240px,100%)] flex-1">
          {content.tagline && <p className="bp-eyebrow site-label m-0 mb-2">{content.tagline}</p>}
          <h2 className={cn("m-0 text-xl", headingClasses(variant))}>{content.title}</h2>
          <p className="mt-2 mb-0 whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {content.body}
          </p>
        </div>
      </div>
      {/* Facts are rows of the section's grid, like the contact details. */}
      {content.facts && content.facts.length > 0 && (
        <dl className="site-items">
          {content.facts.map((f) => (
            <div key={f.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <dt className="site-label w-28 shrink-0">{f.label}</dt>
              <dd className="m-0 min-w-0 font-semibold text-foreground [overflow-wrap:anywhere]">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
