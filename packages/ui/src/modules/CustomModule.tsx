import type { CustomContent } from "@hio/content-model";
import type { ComponentPropsWithoutRef } from "react";
import Markdown, { type Components } from "react-markdown";
import type { StyleVariant } from "../style";
import { cardClasses } from "../variant";
import { SectionHeader } from "./SectionHeader";

/** Markdown headings sit under the section's own h2, so they render as h3/h4. */
const mdComponents: Components = {
  h1: ({ node: _n, ...p }: ComponentPropsWithoutRef<"h3"> & { node?: unknown }) => <h3 {...p} />,
  h2: ({ node: _n, ...p }: ComponentPropsWithoutRef<"h3"> & { node?: unknown }) => <h3 {...p} />,
  h3: ({ node: _n, ...p }: ComponentPropsWithoutRef<"h4"> & { node?: unknown }) => <h4 {...p} />,
};

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
    <section data-module="custom" className={cardClasses(variant)}>
      <SectionHeader title={content.title} variant={variant} />
      {/* `site-prose` restores list bullets, heading sizes and paragraph
          rhythm that Tailwind's reset strips (see globals.css). */}
      <div className="site-prose mt-3 leading-relaxed text-muted-foreground">
        <Markdown components={mdComponents}>{content.body}</Markdown>
      </div>
    </section>
  );
}
