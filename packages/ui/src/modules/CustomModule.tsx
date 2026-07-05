import type { CustomContent } from "@hio/content-model";
import Markdown from "react-markdown";
import { cn } from "../cn";
import type { StyleVariant } from "../style";
import { cardClasses, headingClasses } from "../variant";

/**
 * The escape-hatch module: a title + a markdown body. Renders MARKDOWN, never
 * raw HTML — `react-markdown` (no `rehype-raw` plugin) escapes embedded HTML
 * tags as text rather than executing them, so pasted `<script>`/`<img onerror>`
 * content can't run. Do not add `rehype-raw` here without a sanitizer.
 */
export function CustomModule({
  content,
  variant,
}: { content: CustomContent; variant?: StyleVariant | null }) {
  return (
    <section
      data-module="custom"
      className={cn("mx-auto max-w-[720px] p-10", cardClasses(variant))}
    >
      <h2 className={cn("mt-0 text-xl", headingClasses(variant))}>{content.title}</h2>
      <div className="leading-relaxed text-muted-foreground">
        <Markdown>{content.body}</Markdown>
      </div>
    </section>
  );
}
