import type { ServicesContent } from "@hio/content-model";
import type { CSSProperties } from "react";
import type { StyleVariant } from "../style";
import { cardClasses } from "../variant";
import { SectionHeader, countLabel } from "./SectionHeader";

export function ServicesModule({
  content,
  variant,
}: { content: ServicesContent; variant?: StyleVariant | null }) {
  return (
    <section data-module="services" className={cardClasses(variant)}>
      <SectionHeader
        count={countLabel(content.items.length, "service", "services")}
        title={content.title}
        intro={content.intro}
        variant={variant}
      />
      {content.items.length === 0 ? (
        <p className="mt-4 mb-0 text-muted-foreground">No services yet.</p>
      ) : (
        // Items are cells that run to the section's edges (`.site-items`).
        // Columns collapse to one when the section's own box is narrow:
        // `@container` is set by the page's grid cell.
        <ul
          className="site-items grid-cols-1 @lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ "--cols": content.columns ?? 1 } as CSSProperties}
        >
          {content.items.map((item) => (
            <li key={item.id} className="flex flex-col gap-1">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.image_alt ?? ""}
                  className="site-media aspect-[3/2] object-cover"
                />
              )}
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
                <p className="bp-price m-0 text-foreground text-sm [overflow-wrap:anywhere]">
                  {item.price}
                </p>
              )}
              {item.description && (
                <p className="m-0 mt-1 text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.link_url && (
                <a
                  href={item.link_url}
                  className="mt-auto inline-flex min-h-11 items-center self-start pt-2 font-semibold text-foreground text-sm underline underline-offset-2"
                >
                  {item.link_label || "Learn more"} →
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
