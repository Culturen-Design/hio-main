import type { ServicesContent } from "@hio/content-model";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

export function ServicesModule({
  content,
  variant,
}: { content: ServicesContent; variant?: StyleVariant | null }) {
  return (
    <section className={cn("mx-auto max-w-[720px] p-10", cardClasses(variant))}>
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      {content.items.length === 0 ? (
        <p className="text-muted-foreground">No services yet.</p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {content.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-4 rounded-[12px] border border-border px-4 py-3.5"
            >
              <div>
                <span className="font-semibold text-foreground">{item.name}</span>
                {item.description && (
                  <span className="block text-sm text-muted-foreground">{item.description}</span>
                )}
              </div>
              {item.price && (
                <span className="font-semibold whitespace-nowrap text-foreground">
                  {item.price}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
