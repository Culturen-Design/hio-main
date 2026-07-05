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
      {content.items.length === 0 ? (
        <p className="text-muted-foreground">No testimonials yet.</p>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0">
          {content.items.map((t) => (
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
          ))}
        </ul>
      )}
    </section>
  );
}
