import type {
  BioContent,
  HeroContent,
  LinksContent,
  ModuleType,
  StyleVariant,
} from "@hio/content-model";
import { BioModule } from "./BioModule";
import { HeroModule } from "./HeroModule";
import { LinksModule } from "./LinksModule";

/** Minimal shape needed to render a section (decoupled from the DB row type). */
export interface RenderableSection {
  type: ModuleType;
  content: unknown;
  style_variant?: StyleVariant | null;
}

/**
 * Renders any supported module. The set of supported types mirrors the built-in
 * SchemaProvider; Studio (M4) can supply its own renderers per client theme.
 */
export function ModuleRenderer({ section }: { section: RenderableSection }) {
  const variant = section.style_variant ?? undefined;
  switch (section.type) {
    case "hero":
      return <HeroModule content={section.content as HeroContent} variant={variant} />;
    case "bio":
      return <BioModule content={section.content as BioContent} variant={variant} />;
    case "links":
      return <LinksModule content={section.content as LinksContent} variant={variant} />;
    default:
      return (
        <div style={{ padding: "1rem 1.5rem", color: "#9ca3af" }}>
          Unsupported module: {section.type}
        </div>
      );
  }
}
