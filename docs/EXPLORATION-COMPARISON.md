# Exploration Comparison — hio-builder vs hio-space-poli

Deep analysis of the two implementations now frozen as `exploration/hio-builder` and
`exploration/hio-space-poli`, to decide what `integration/v2` takes from each.

## TL;DR

| | **hio-builder** (yours) | **hio-space-poli** (teammate's) |
|---|---|---|
| Product framing | **Creator link-in-bio / personal page builder** | **AI website builder for SMBs** (salons, restaurants, plumbers) |
| Framework | Vite + React 18 + React Router 7 | **Next.js 16** + React 19 |
| Styling | CSS Modules + design tokens (`tokens.css`) | **Tailwind v4 + shadcn/ui** + semantic HSL tokens |
| Maturity | **~80% of an MVP** (13 commits, Phases 0–5) | ~10% (2 commits — shell + 1 component) |
| Backend | **Full Supabase**: 4 migrations, RLS, triggers, edge fn | None yet |
| AI editing | **Working** Claude Haiku edge function w/ tools | Described in copy only |
| Data model | page → sections → 9 module types | business → services/products/team/leads + versioned WebsiteConfig |
| Design polish | Functional | **Higher** (beautiful hero, shadcn, a11y) |
| Docs | **Excellent** (ARCHITECTURE/MODULES/DATABASE/AI/DESIGN) | Minimal (clever AGENTS.md guardrail) |

**The headline:** the two are at opposite ends of two axes — **builder has the working product & backend; poli has the better foundation & design + a richer SMB data model.** And they target *different customers*. That product question must be settled first.

---

## The real decision: which product?

- **hio-builder** = a **personal page builder** (think Linktree++). One page per user at `/[slug]`,
  9 content modules, free/paid tiers, admin panel. Audience: creators/individuals.
- **hio-space-poli** = an **SMB website builder**. Onboarding wizard → AI generates a business site;
  data model has `Business`, `Service`, `Product`, `TeamMember`, `Lead`, version history. Audience:
  local businesses.

They share the *mechanics* (modular sections + AI chat editing + public page) but the **data model,
audience, and copy diverge.** `integration/v2` can't "merge" both product definitions — pick one
direction, then pull the best engineering from each.

---

## Deep dive — hio-builder (yours)

**Crown jewels (reuse these):**
- **`supabase/functions/ai-command/index.ts`** — genuinely production-grade: JWT verification,
  page-ownership check, service-role isolated server-side, Claude Haiku with tool declarations,
  prompt caching (`cache_control`), protected-field guard, tool-gated mutations. This is the hardest
  part of the whole product and it already works.
- **Supabase schema & security** — 4 well-sequenced migrations, RLS on every table, `handle_new_user`
  auto-provisioning trigger, `reorder_sections` RPC, **two-layer tier enforcement** (client filter +
  `allowed_module_types()` RLS). Defense-in-depth done right.
- **Service layer** (`src/services/supabase.ts`) — all DB access centralized (components never touch
  the client directly). Clean, typed, sensible error handling.
- **9 working module renderers** + `ModuleRenderer` registry switch + dnd-kit drag-reorder + optimistic
  updates with rollback.
- **Docs** — `docs/` already encodes migration immutability, module-add checklist, RLS matrix. These
  map almost 1:1 onto our guardrails.

**Weaknesses:**
- Vite/React-Router SPA → **framework migration needed** to land on our Next.js guardrails.
- No tests. ESLint only.
- `getAdminUsers()` does several client-side joins + an RPC — fine for now, should become one RPC.
- Visual design is functional but less refined than poli's.

## Deep dive — hio-space-poli (teammate's)

**Crown jewels (reuse these):**
- **`src/components/sections/SectionHero.tsx`** — exemplary component architecture: atoms → 3 variants
  (image-left / text-only / inverted) → master export, semantic DS tokens, real accessibility
  (`focus-visible`, `aria-hidden`). This is the design bar v2 should hold every section to.
- **Next.js 16 App Router foundation** — route groups `(app)` / `(auth)`, SEO metadata, Tailwind v4 +
  shadcn wired up. Directly compatible with our guardrails skeleton.
- **Domain type model** (`src/types/index.ts`) — forward-thinking: `Business`, `Service`, `Product`,
  `TeamMember`, `Lead`, **`WebsiteConfig` (sections JSON) + `WebsiteVersion` (version history, user vs
  ai authored)**, `OnboardingData`. The version-history idea is something builder lacks and is worth keeping.
- **Landing page** (`src/app/page.tsx`) — polished marketing copy and structure; better than builder's.
- `AGENTS.md` guardrail ("read node_modules docs before writing — APIs differ from training data").

**Weaknesses:**
- ~10% built. Auth pages are **UI-only** (plain inputs, no Supabase). Dashboard/onboarding are stubs.
- No backend, no migrations, no RLS, no AI implementation.
- On bleeding-edge Next 16.2.9 / React 19.2.4 (our starter assumed Next 15) — needs version alignment.

---

## Recommended v2 = poli's foundation + builder's depth

Component-by-component "best of both", ported onto the guardrails (`main`):

| Concern | Take from | Notes |
|---|---|---|
| App shell, routing, SEO | **poli** | Next 16 App Router, route groups, metadata |
| Styling / design system | **poli** | Tailwind v4 + shadcn + semantic tokens; hold all sections to SectionHero's bar |
| Landing page | **poli** | Restyle/keep |
| Section/module **visuals** | **poli** | SectionHero variant approach as the template |
| Section/module **data contracts** | **builder** | builder's typed `*Content` interfaces are battle-tested |
| Supabase schema, RLS, triggers, auto-provision | **builder** | adapt to chosen data model; keep the security model verbatim |
| **AI edit edge function** | **builder** | reuse near-verbatim; re-point tools at the chosen model |
| Tiers + admin panel | **builder** | unique to builder; keep |
| Version history of edits | **poli** (concept) | add as a migration; great with the AI editor |
| Service-layer pattern | **builder** | centralized DB access — enforce via guardrails |
| Docs | **builder** | carry `docs/` over; already aligns with CLAUDE.md |
| Guardrails (hooks/CI/skills) | **main** | everything lands through PRs + review |

**Biggest lift:** porting builder's Vite/React-Router code into Next.js App Router (routing, data
fetching → Server Components, `import.meta.env` → `process.env`). The *logic* transfers; the *plumbing*
is rewritten — exactly the kind of work that should flow through the `new-feature` + `review-pr` skills.

**Starter tweaks implied:** bump our skeleton to Next 16 + React 19.2, add Tailwind v4 + shadcn, and
adopt builder's migration-numbering doc conventions (already compatible).

---

## Suggested integration order (into `integration/v2`)

1. Align the starter (`main`) to the real stack: Next 16, Tailwind v4, shadcn, design tokens from poli.
2. **Decide the product + data model** (creator vs SMB). Write it into `docs/`.
3. Port builder's Supabase schema/RLS/triggers as migrations (adapted to the chosen model).
4. Port the AI edge function; wire tools to the model.
5. Bring section/module visuals over to shadcn/DS, using builder's data contracts + poli's SectionHero style.
6. Add tiers/admin (builder) and version history (poli concept).
7. Each step = a reviewed PR through the guardrails.
