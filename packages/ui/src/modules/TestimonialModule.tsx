import type { TestimonialContent } from "@hio/content-model";
import type { StyleVariant } from "../style";
import { cardClasses } from "../variant";
import { SectionHeader, countLabel } from "./SectionHeader";

export function TestimonialModule({
  content,
  variant,
}: { content: TestimonialContent; variant?: StyleVariant | null }) {
  return (
    <section data-module="testimonial" className={cardClasses(variant)}>
      <SectionHeader
        count={countLabel(content.items.length, "testimonial", "testimonials")}
        title={content.title}
        intro={content.intro}
        variant={variant}
      />
      {content.items.length === 0 ? (
        <p className="mt-4 mb-0 text-muted-foreground">No testimonials yet.</p>
      ) : (
        <ul className="site-items grid-cols-1 @3xl:grid-cols-2">
          {content.items.map((t) => {
            // Clamp defensively: content is schema-validated on write, but a DB
            // row is rendered as-is — a bad rating must not crash the page
            // (String.repeat throws on a negative count).
            const rating =
              typeof t.rating === "number" ? Math.min(5, Math.max(0, Math.round(t.rating))) : null;
            return (
              <li key={t.id} className="flex flex-col gap-3">
                {rating !== null && (
                  <span
                    className="bp-rating block text-primary text-sm"
                    role="img"
                    aria-label={`Rated ${rating} out of 5`}
                  >
                    {"★".repeat(rating)}
                    <span aria-hidden="true" className="text-muted-foreground/60">
                      {"☆".repeat(5 - rating)}
                    </span>
                  </span>
                )}
                <blockquote className="m-0 text-foreground leading-[1.55]">“{t.quote}”</blockquote>
                <div className="mt-auto flex items-center gap-2.5">
                  {t.avatar_url && (
                    <img src={t.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                  )}
                  <div className="text-sm">
                    <span className="font-semibold">{t.author}</span>
                    {t.role && <span className="text-muted-foreground"> · {t.role}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
