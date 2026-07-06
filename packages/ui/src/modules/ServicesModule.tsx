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
      {content.intro && (
        <p className="mt-1 mb-5 max-w-[560px] leading-relaxed text-muted-foreground">
          {content.intro}
        </p>
      )}
      {content.items.length === 0 ? (
        <p className="text-muted-foreground">No services yet.</p>
      ) : (
        <ul
          className="m-0 grid list-none gap-3 p-0"
          style={{ gridTemplateColumns: `repeat(${content.columns ?? 1}, minmax(0, 1fr))` }}
        >
          {content.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col overflow-hidden rounded-[12px] border border-border"
            >
              {/* Image is optional per item — with none, the card is simply the
                  text block below, which is the module's historical shape, so a
                  mixed grid still reads as intentional. */}
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.image_alt ?? ""}
                  className="block aspect-[3/2] w-full border-border border-b object-cover"
                />
              )}
              <div className="flex flex-1 flex-col px-4 py-3.5">
                <div className="flex items-baseline gap-2">
                  {item.icon && (
                    <span aria-hidden="true" className="shrink-0 leading-none">
                      {item.icon}
                    </span>
                  )}
                  <span className="font-semibold text-foreground">{item.name}</span>
                  {item.price && (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-0 min-w-3 flex-1 border-border border-b border-dotted"
                      />
                      <span className="whitespace-nowrap font-semibold text-foreground">
                        {item.price}
                      </span>
                    </>
                  )}
                </div>
                {item.description && (
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {item.description}
                  </span>
                )}
                {item.link_url && (
                  <a
                    href={item.link_url}
                    className="mt-auto self-start pt-2 font-semibold text-foreground text-sm underline underline-offset-2"
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
