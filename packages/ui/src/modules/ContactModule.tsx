import type { ContactContent } from "@hio/content-model";
import type { StyleVariant } from "../style";
import { cardClasses } from "../variant";
import { SectionHeader } from "./SectionHeader";

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
    <section data-module="contact" className={cardClasses(variant)}>
      <SectionHeader
        count="contact"
        title={content.title}
        intro={content.intro}
        variant={variant}
      />
      {content.cta_label && content.cta_url && (
        <a href={content.cta_url} className="site-button mt-5">
          {content.cta_label}
        </a>
      )}
      {/* The details are rows of the section's own grid: label, then value,
          wrapping under the label when the cell is narrow. */}
      {rows.length > 0 && (
        <dl className="site-items">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <dt className="site-label w-20 shrink-0">{r.label}</dt>
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
    </section>
  );
}
