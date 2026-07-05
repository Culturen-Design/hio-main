import type { TestimonialContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function TestimonialModule({
  content,
  variant,
}: { content: TestimonialContent; variant?: StyleVariant | null }) {
  return (
    <section
      data-module="testimonial"
      className={cn("mx-auto max-w-[720px] p-10", cardClasses(variant))}
    >
      <p className="bp-count" aria-hidden>
        {content.items.length} {content.items.length === 1 ? "testimonial" : "testimonials"}
      </p>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.intro && (
        <p className="mt-1 mb-5 max-w-[560px] leading-relaxed text-muted-foreground">
          {content.intro}
        </p>
      )}
      {content.items.length === 0 ? (
        <p className="text-muted-foreground">No testimonials yet.</p>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0">
          {content.items.map((t) => {
            // Clamp defensively: content is schema-validated on write, but a DB
            // row is rendered as-is — a bad rating must not crash the page
            // (String.repeat throws on a negative count).
            const rating =
              typeof t.rating === "number" ? Math.min(5, Math.max(0, Math.round(t.rating))) : null;
            return (
              <li
                key={t.id}
                className="relative rounded-[12px] border border-border px-5 py-[1.1rem]"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-2 left-4 font-serif text-4xl text-primary/25 leading-none"
                >
                  “
                </span>
                {rating !== null && (
                  <span
                    className="bp-rating block pl-5 text-primary text-sm"
                    aria-label={`Rated ${rating} out of 5`}
                  >
                    {"★".repeat(rating)}
                    <span aria-hidden="true" className="text-border">
                      {"☆".repeat(5 - rating)}
                    </span>
                  </span>
                )}
                <blockquote className="relative m-0 pl-5 text-foreground leading-[1.55]">
                  {t.quote}
                </blockquote>
                <div className="mt-3 flex items-center gap-2.5">
                  {t.avatar_url && (
                    <img
                      src={t.avatar_url}
                      alt={t.author}
                      className="h-9 w-9 rounded-full object-cover"
                    />
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
