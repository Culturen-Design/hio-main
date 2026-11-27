import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { headingClasses } from "../variant";

/**
 * The one header every list-style module uses: an optional count (shown only
 * by styles that ask for it), the title, and an optional intro. Spacing below
 * it comes from what follows (`.site-items` / `.site-bleed`), never from here.
 */
export function SectionHeader({
  count,
  title,
  intro,
  variant,
}: {
  count?: string;
  title: string;
  intro?: string | null;
  variant?: StyleVariant | null;
}) {
  return (
    <>
      {count && (
        <p className="bp-count" aria-hidden>
          {count}
        </p>
      )}
      <h2 className={cn("m-0 text-xl", headingClasses(variant))}>{title}</h2>
      {intro && <p className="mt-2 mb-0 leading-relaxed text-muted-foreground">{intro}</p>}
    </>
  );
}

/** "3 services" / "1 service" — the count line's text. */
export const countLabel = (n: number, one: string, many: string): string =>
  `${n} ${n === 1 ? one : many}`;
