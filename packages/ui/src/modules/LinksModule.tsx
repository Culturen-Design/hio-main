import type { LinksContent } from "@hio/content-model";
import type { CSSProperties } from "react";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function LinksModule({
  content,
  variant,
}: { content: LinksContent; variant?: StyleVariant | null }) {
  return (
    <section
      data-module="links"
      className={cn("mx-auto max-w-[720px] p-6 sm:p-10", cardClasses(variant))}
    >
      <p className="bp-count" aria-hidden>
        {content.items.length} {content.items.length === 1 ? "link" : "links"}
      </p>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.intro && (
        <p className="mt-1 mb-5 max-w-[560px] leading-relaxed text-muted-foreground">
          {content.intro}
        </p>
      )}
      {content.items.length === 0 ? (
        <p className="text-muted-foreground">No links yet.</p>
      ) : (
        <div
          className="bp-cells grid grid-cols-1 gap-3 @lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ "--cols": content.columns ?? 1 } as CSSProperties}
        >
          {content.items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              className="block min-w-0 rounded-[12px] border border-border px-4 py-3.5 text-foreground no-underline"
            >
              <span className="font-semibold [overflow-wrap:anywhere]">
                {item.icon && <span aria-hidden="true">{item.icon} </span>}
                {item.title}
              </span>
              {item.description && (
                <span className="block text-muted-foreground text-sm">{item.description}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
