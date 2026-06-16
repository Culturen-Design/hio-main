import { SectionHero } from "@/components/sections/SectionHero";

const DEMO_PROPS = {
  eyebrow: "✦  Award-Winning Service · Sofia",
  headline: "The smarter way\nto grow your business",
  body: "Describe what sets you apart in one clear sentence. Lead with the benefit, name your location, and make the customer the hero.",
  ctaPrimary:   { label: "Book Appointment", href: "#book"  },
  ctaSecondary: { label: "See Our Work",     href: "#work"  },
};

export default function HeroPreviewPage() {
  return (
    <main className="min-h-screen bg-zinc-100">
      {/* Page header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">hio.space / Design System</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">SectionHero — Master Component</h1>
        <p className="mt-1 text-sm text-zinc-500">3 variants using hio DS semantic tokens</p>
      </div>

      <div className="space-y-16 py-16">

        {/* Variant 1 */}
        <section className="px-8">
          <p className="mb-3 font-mono text-xs font-medium tracking-widest text-indigo-500">
            VARIANT 1 — image-left
          </p>
          <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-zinc-200">
            <SectionHero variant="image-left" {...DEMO_PROPS} />
          </div>
        </section>

        {/* Variant 2 */}
        <section className="px-8">
          <p className="mb-3 font-mono text-xs font-medium tracking-widest text-indigo-500">
            VARIANT 2 — text-only
          </p>
          <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-zinc-200">
            <SectionHero
              variant="text-only"
              eyebrow="📍  Serving Sofia & Surroundings"
              headline={"Your headline —\nmake every word count"}
              body="A single, powerful sentence about what makes you different and why customers should choose you over everyone else."
              ctaPrimary={  { label: "Get Started Free",    href: "#" }}
              ctaSecondary={ { label: "See How It Works",   href: "#" }}
            />
          </div>
        </section>

        {/* Variant 3 */}
        <section className="px-8 pb-16">
          <p className="mb-3 font-mono text-xs font-medium tracking-widest text-indigo-500">
            VARIANT 3 — inverted
          </p>
          <div className="overflow-hidden rounded-2xl shadow-sm">
            <SectionHero
              variant="inverted"
              eyebrow="⭐  4.9 · 200+ Happy Clients"
              headline={"Premium service,\npersonal touch"}
              body="Everything your customers expect — beautifully presented, instantly live, effortlessly managed by AI."
              ctaPrimary={  { label: "Book Now",    href: "#" }}
              ctaSecondary={ { label: "Learn More", href: "#" }}
            />
          </div>
        </section>

      </div>
    </main>
  );
}
