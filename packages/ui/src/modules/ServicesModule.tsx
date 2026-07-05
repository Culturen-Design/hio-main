import type { ServicesContent } from "@hio/content-model";
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
      className={cn("mx-auto max-w-[720px] p-10", cardClasses(variant))}
    >
      <p className="bp-count" aria-hidden>
        {content.items.length} {content.items.length === 1 ? "service" : "services"}
      </p>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.items.length === 0 ? (
        <p className="text-muted-foreground">No services yet.</p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {content.items.map((item) => (
            <li key={item.id} className="rounded-[12px] border border-border px-4 py-3.5">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-foreground">{item.name}</span>
                {item.price && (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-0 flex-1 border-border border-b border-dotted"
                    />
                    <span className="whitespace-nowrap font-semibold text-foreground">
                      {item.price}
                    </span>
                  </>
                )}
              </div>
              {item.description && (
                <span className="mt-1 block text-sm text-muted-foreground">{item.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
