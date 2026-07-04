import type { CustomContent } from "@hio/content-model";
import Markdown from "react-markdown";
import type { StyleVariant } from "../style";

/**
 * The escape-hatch module: a title + a markdown body. Renders MARKDOWN, never
 * raw HTML — `react-markdown` (no `rehype-raw` plugin) escapes embedded HTML
 * tags as text rather than executing them, so pasted `<script>`/`<img onerror>`
 * content can't run. Do not add `rehype-raw` here without a sanitizer.
 */
export function CustomModule({
  content,
}: { content: CustomContent; variant?: StyleVariant | null }) {
  return (
    <section style={{ padding: "2.5rem 1.5rem", maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>{content.title}</h2>
      <div style={{ color: "#374151", lineHeight: 1.6 }}>
        <Markdown>{content.body}</Markdown>
      </div>
    </section>
  );
}
