import type {
  BioContent,
  CalendarContent,
  ContactContent,
  CustomContent,
  GalleryContent,
  HeroContent,
  LinksContent,
  ModuleType,
  ServicesContent,
  TestimonialContent,
} from "@hio/content-model";
import type { StyleVariant } from "../style";
import { BioModule } from "./BioModule";
import { CalendarModule } from "./CalendarModule";
import { ContactModule } from "./ContactModule";
import { CustomModule } from "./CustomModule";
import { GalleryModule } from "./GalleryModule";
import { HeroModule } from "./HeroModule";
import { LinksModule } from "./LinksModule";
import { ServicesModule } from "./ServicesModule";
import { TestimonialModule } from "./TestimonialModule";

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
    case "calendar":
      return <CalendarModule content={section.content as CalendarContent} variant={variant} />;
    case "contact":
      return <ContactModule content={section.content as ContactContent} variant={variant} />;
    case "services":
      return <ServicesModule content={section.content as ServicesContent} variant={variant} />;
    case "gallery":
      return <GalleryModule content={section.content as GalleryContent} variant={variant} />;
    case "testimonial":
      return (
        <TestimonialModule content={section.content as TestimonialContent} variant={variant} />
      );
    case "custom":
      return <CustomModule content={section.content as CustomContent} variant={variant} />;
    default:
      return (
        <div className="px-6 py-4 text-muted-foreground">Unsupported module: {section.type}</div>
      );
  }
}
