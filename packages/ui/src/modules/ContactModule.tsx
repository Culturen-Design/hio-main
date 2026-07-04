import type { ContactContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function ContactModule({
  content,
  variant,
}: { content: ContactContent; variant?: StyleVariant | null }) {
  const rows: Array<{ label: string; value: string; href?: string }> = [];
  if (content.email)
    rows.push({ label: "Email", value: content.email, href: `mailto:${content.email}` });
  if (content.phone)
    rows.push({ label: "Phone", value: content.phone, href: `tel:${content.phone}` });
  if (content.location) rows.push({ label: "Location", value: content.location });

  return (
    <section className={cn("mx-auto max-w-xl p-10", cardClasses(variant))}>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.intro && <p className="leading-relaxed text-muted-foreground">{content.intro}</p>}
      {rows.length > 0 && (
        <dl className="mt-5 grid gap-2">
          {rows.map((r) => (
            <div key={r.label} className="flex gap-3">
              <dt className="w-20 text-sm text-muted-foreground">{r.label}</dt>
              <dd className="m-0">
                {r.href ? (
                  <a href={r.href} className="text-foreground underline-offset-2 hover:underline">
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
