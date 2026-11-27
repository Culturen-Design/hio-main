import type { LinksContent } from "@hio/content-model";
import type { CSSProperties } from "react";
import type { StyleVariant } from "../style";
import { cardClasses } from "../variant";
import { SectionHeader, countLabel } from "./SectionHeader";

export function LinksModule({
  content,
  variant,
}: { content: LinksContent; variant?: StyleVariant | null }) {
  return (
    <section data-module="links" className={cardClasses(variant)}>
      <SectionHeader
        count={countLabel(content.items.length, "link", "links")}
        title={content.title}
        intro={content.intro}
        variant={variant}
      />
      {content.items.length === 0 ? (
        <p className="mt-4 mb-0 text-muted-foreground">No links yet.</p>
      ) : (
        // Each link is a whole cell.
        <div
          className="site-items grid-cols-1 @lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ "--cols": content.columns ?? 1 } as CSSProperties}
        >
          {content.items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              className="block text-foreground no-underline hover:bg-muted"
            >
              <span className="font-semibold underline underline-offset-2 [overflow-wrap:anywhere]">
                {item.icon && <span aria-hidden="true">{item.icon} </span>}
                {item.title}
              </span>
              {item.description && (
                <span className="mt-1 block text-muted-foreground text-sm">{item.description}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
