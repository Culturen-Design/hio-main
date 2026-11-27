import type { GridSection } from "./SiteSections";

/**
 * Fixed sample content for the site-look preview iframes (Self-Serve settings,
 * Studio theme form). No real user data. Widths show the grid working: a full
 * hero, a full services row, then a half + half row.
 */
export const PREVIEW_SECTIONS: GridSection[] = [
  {
    id: "preview-hero",
    type: "hero",
    width: 12,
    content: {
      eyebrow: "Preview",
      headline: "Your headline goes here",
      subheadline: "A short line about what you do.",
      cta_label: "See it in action",
      cta_url: "#",
    },
  },
  {
    id: "preview-services",
    type: "services",
    width: 12,
    content: {
      title: "Services",
      columns: 3,
      items: [
        { id: "s1", name: "Signature cut", price: "€45", description: "Wash, cut and finish." },
        { id: "s2", name: "Colour session", price: "from €80", description: "Full or partial." },
        {
          id: "s3",
          name: "Consultation",
          price: "Free",
          description: "Fifteen minutes, no obligation.",
        },
      ],
    },
  },
  {
    id: "preview-testimonial",
    type: "testimonial",
    width: 6,
    content: {
      title: "Kind words",
      items: [
        {
          id: "t1",
          quote: "Calm, careful and exactly what I asked for.",
          author: "A client",
          rating: 5,
        },
      ],
    },
  },
  {
    id: "preview-contact",
    type: "contact",
    width: 6,
    content: {
      title: "Get in touch",
      intro: "The instrument panel — the one dark accent per page.",
      email: "hello@example.com",
      phone: "+1 555 0100",
      location: "Anywhere",
    },
  },
];
