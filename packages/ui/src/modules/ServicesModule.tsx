import type { ServicesContent } from "@hio/content-model";
import type { CSSProperties } from "react";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function ServicesModule({
  content,
  variant,
}: { content: ServicesContent; variant?: StyleVariant | null }) {
  return (
    <section
      data-module="services"
      className={cn("mx-auto max-w-[720px] p-6 sm:p-10", cardClasses(variant))}
    >
      <p className="bp-count" aria-hidden>
        {content.items.length} {content.items.length === 1 ? "service" : "services"}
      </p>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.intro && (
        <p className="mt-1 mb-5 max-w-[560px] leading-relaxed text-muted-foreground">
          {content.intro}
        </p>
      )}
      {content.items.length === 0 ? (
        <p className="text-muted-foreground">No services yet.</p>
      ) : (
        // Columns collapse to one when the module's own box is narrow (a phone,
        // or a narrow grid cell): `@container` is set by the page's grid cell.
        <ul
          className="bp-cells m-0 grid list-none grid-cols-1 gap-3 p-0 @lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ "--cols": content.columns ?? 1 } as CSSProperties}
        >
          {content.items.map((item) => (
            <li key={item.id} className="flex min-w-0 flex-col rounded-[12px] border border-border">
              {/* Image is optional per item — with none, the card is simply the
                  text block below, so a mixed grid still reads as intentional. */}
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.image_alt ?? ""}
                  className="block aspect-[3/2] w-full rounded-t-[11px] border-border border-b object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-1 px-4 py-3.5">
                {/* Name and price each get their own line: a long name or a
                    price like "$65 per session" must never be cut off. */}
                <p className="m-0 flex min-w-0 items-baseline gap-2 font-semibold text-foreground">
                  {item.icon && (
                    <span aria-hidden="true" className="shrink-0 leading-none">
                      {item.icon}
                    </span>
                  )}
                  <span className="min-w-0 [overflow-wrap:anywhere]">{item.name}</span>
                </p>
                {item.price && (
                  <p className="bp-price m-0 font-semibold text-foreground text-sm [overflow-wrap:anywhere]">
                    {item.price}
                  </p>
                )}
                {item.description && (
                  <p className="m-0 text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                )}
                {item.link_url && (
                  <a
                    href={item.link_url}
                    className="mt-auto inline-flex min-h-11 items-center self-start font-semibold text-foreground text-sm underline underline-offset-2"
                  >
                    {item.link_label || "Learn more"} →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
