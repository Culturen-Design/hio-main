import type { LinksContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function LinksModule({
  content,
  variant,
}: { content: LinksContent; variant?: StyleVariant | null }) {
  return (
    <section data-module="links" className={cn("mx-auto max-w-[720px] p-10", cardClasses(variant))}>
      <p className="bp-count" aria-hidden>
        {content.items.length} {content.items.length === 1 ? "link" : "links"}
      </p>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.items.length === 0 ? (
        <p className="text-muted-foreground">No links yet.</p>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${content.columns}, minmax(0, 1fr))` }}
        >
          {content.items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              className="block rounded-[12px] border border-border px-4 py-3.5 text-foreground no-underline"
            >
              <span className="font-semibold">
                {item.icon ? `${item.icon} ` : ""}
                {item.title}
              </span>
              {item.description && (
                <span className="block text-[13px] text-muted-foreground">{item.description}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
