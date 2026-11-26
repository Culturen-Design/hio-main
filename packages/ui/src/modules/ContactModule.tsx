import type { ContactContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

/** `tel:` links must not contain spaces or punctuation — keep digits and a leading +. */
export const telHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function ContactModule({
  content,
  variant,
}: { content: ContactContent; variant?: StyleVariant | null }) {
  const rows: Array<{ label: string; value: string; href?: string }> = [];
  if (content.email)
    rows.push({ label: "Email", value: content.email, href: `mailto:${content.email}` });
  if (content.phone)
    rows.push({ label: "Phone", value: content.phone, href: telHref(content.phone) });
  if (content.location) rows.push({ label: "Location", value: content.location });
  if (content.hours) rows.push({ label: "Hours", value: content.hours });

  return (
    <section
      data-module="contact"
      className={cn("mx-auto max-w-xl p-6 sm:p-10", cardClasses(variant))}
    >
      <p className="bp-count" aria-hidden>
        contact
      </p>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.intro && <p className="leading-relaxed text-muted-foreground">{content.intro}</p>}
      {rows.length > 0 && (
        <dl className="mt-5 grid gap-3">
          {rows.map((r) => (
            // Wraps on a narrow box: the label stays put and the value drops
            // below it instead of pushing past the section's edge.
            <div key={r.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <dt className="w-20 shrink-0 rounded-card border border-border bg-muted px-2 py-1 text-center text-muted-foreground text-xs uppercase tracking-wide">
                {r.label}
              </dt>
              <span className="bp-leader" aria-hidden />
              <dd className="m-0 min-w-0 [overflow-wrap:anywhere]">
                {r.href ? (
                  <a href={r.href} className="text-foreground underline underline-offset-2">
                    {r.value}
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {content.cta_label && content.cta_url && (
        <a
          href={content.cta_url}
          className="bp-offset bp-cta mt-6 inline-block rounded-[8px] bg-primary px-5 py-2.5 font-semibold text-primary-foreground no-underline"
        >
          {content.cta_label}
        </a>
      )}
    </section>
  );
}
