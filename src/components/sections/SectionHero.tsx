/**
 * SectionHero — Master Component
 * hio.space Design System
 *
 * Variants:
 *   "image-left"  — Image left column, text right column
 *   "text-only"   — Centered text, no image
 *   "inverted"    — Dark background, text left, image right
 *
 * All colors, spacing and typography reference hio DS semantic tokens
 * mapped to CSS variables in globals.css (shadcn/ui compatible).
 */

import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export type HeroVariant = "image-left" | "text-only" | "inverted";

export interface HeroProps {
  variant?: HeroVariant;
  /** Small label above headline (e.g. "⭐ 4.9 · 200 Reviews") */
  eyebrow?: string;
  /** Main headline — supports line breaks via \n */
  headline: string;
  /** Supporting paragraph */
  body?: string;
  /** Primary CTA */
  ctaPrimary?: { label: string; href: string };
  /** Secondary CTA */
  ctaSecondary?: { label: string; href: string };
  /** Image URL (used in image-left and inverted variants) */
  imageSrc?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Extra class on the root element */
  className?: string;
}

// ─── Sub-components (atoms) ────────────────────────────────────────────────

function Eyebrow({
  text,
  dark = false,
}: {
  text: string;
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        dark
          ? "border-[hsl(var(--border)/0.3)] bg-[hsl(var(--foreground)/0.08)] text-[hsl(var(--muted-foreground))]"
          : "border-border bg-muted text-muted-foreground"
      )}
    >
      {text}
    </span>
  );
}

function ButtonPrimary({
  label,
  href,
  dark = false,
}: {
  label: string;
  href: string;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        dark
          ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] focus-visible:outline-[hsl(var(--foreground))]"
          : "bg-primary text-primary-foreground focus-visible:outline-primary"
      )}
    >
      {label}
    </a>
  );
}

function ButtonOutline({
  label,
  href,
  dark = false,
}: {
  label: string;
  href: string;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-medium transition-colors hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        dark
          ? "border-[hsl(var(--border)/0.3)] text-[hsl(var(--foreground))] focus-visible:outline-[hsl(var(--foreground))]"
          : "border-border text-foreground focus-visible:outline-primary"
      )}
    >
      {label}
    </a>
  );
}

function ImagePlaceholder({
  src,
  alt,
  dark = false,
  className,
}: {
  src?: string;
  alt?: string;
  dark?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn("overflow-hidden rounded-2xl", className)}>
        <img
          src={src}
          alt={alt ?? ""}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl",
        dark ? "bg-white/5" : "bg-muted",
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-xl",
          dark ? "bg-white/10" : "bg-border"
        )}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={dark ? "text-white/30" : "text-muted-foreground/40"}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    </div>
  );
}

// ─── Variants ──────────────────────────────────────────────────────────────

/**
 * VARIANT 1: Image Left / Text Right
 * Best for: salons, spas, restaurants — visual-first businesses
 */
function HeroImageLeft({
  eyebrow,
  headline,
  body,
  ctaPrimary,
  ctaSecondary,
  imageSrc,
  imageAlt,
}: HeroProps) {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-20 lg:flex-row lg:gap-16">
        {/* Image */}
        <div className="w-full lg:w-[48%] lg:shrink-0">
          <ImagePlaceholder
            src={imageSrc}
            alt={imageAlt}
            className="aspect-[4/3] w-full"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-6">
          {eyebrow && <Eyebrow text={eyebrow} />}

          <h1 className="text-foreground text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight">
            {headline}
          </h1>

          {body && (
            <p className="text-muted-foreground max-w-[50ch] text-base leading-relaxed lg:text-lg">
              {body}
            </p>
          )}

          {(ctaPrimary || ctaSecondary) && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {ctaPrimary && (
                <ButtonPrimary label={ctaPrimary.label} href={ctaPrimary.href} />
              )}
              {ctaSecondary && (
                <ButtonOutline label={ctaSecondary.label} href={ctaSecondary.href} />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * VARIANT 2: Text Only — Centered
 * Best for: SaaS, agencies, any business without a strong hero image
 */
function HeroTextOnly({
  eyebrow,
  headline,
  body,
  ctaPrimary,
  ctaSecondary,
}: HeroProps) {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
        {eyebrow && <Eyebrow text={eyebrow} />}

        <h1 className="text-foreground text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight">
          {headline}
        </h1>

        {body && (
          <p className="text-muted-foreground max-w-[55ch] text-lg leading-relaxed">
            {body}
          </p>
        )}

        {(ctaPrimary || ctaSecondary) && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {ctaPrimary && (
              <ButtonPrimary label={ctaPrimary.label} href={ctaPrimary.href} />
            )}
            {ctaSecondary && (
              <ButtonOutline label={ctaSecondary.label} href={ctaSecondary.href} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * VARIANT 3: Inverted Dark
 * Best for: premium/luxury brands, gyms, tech-forward SMBs
 */
function HeroInverted({
  eyebrow,
  headline,
  body,
  ctaPrimary,
  ctaSecondary,
  imageSrc,
  imageAlt,
}: HeroProps) {
  return (
    <section
      className="bg-[hsl(var(--foreground))]"
      style={{ backgroundColor: "#0f0f12" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-20 lg:flex-row lg:gap-16">
        {/* Text */}
        <div className="flex flex-col gap-6">
          {eyebrow && <Eyebrow text={eyebrow} dark />}

          <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight text-white">
            {headline}
          </h1>

          {body && (
            <p className="max-w-[50ch] text-base leading-relaxed text-white/60 lg:text-lg">
              {body}
            </p>
          )}

          {(ctaPrimary || ctaSecondary) && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {ctaPrimary && (
                <ButtonPrimary label={ctaPrimary.label} href={ctaPrimary.href} dark />
              )}
              {ctaSecondary && (
                <ButtonOutline label={ctaSecondary.label} href={ctaSecondary.href} dark />
              )}
            </div>
          )}
        </div>

        {/* Image */}
        <div className="w-full lg:w-[48%] lg:shrink-0">
          <ImagePlaceholder
            src={imageSrc}
            alt={imageAlt}
            dark
            className="aspect-[4/3] w-full"
          />
        </div>
      </div>
    </section>
  );
}

// ─── Master Export ──────────────────────────────────────────────────────────

export function SectionHero({
  variant = "image-left",
  className,
  ...props
}: HeroProps) {
  return (
    <div className={className}>
      {variant === "image-left" && <HeroImageLeft {...props} />}
      {variant === "text-only"  && <HeroTextOnly  {...props} />}
      {variant === "inverted"   && <HeroInverted  {...props} />}
    </div>
  );
}
