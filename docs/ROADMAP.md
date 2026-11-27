# hio — Product Roadmap

The single source of truth for **what we are building and in what order**. hio is two
products on one engine; this roadmap tracks the migration from two explorations to one
monorepo, milestone by milestone.

- **Origin:** distilled from the original architecture plan (Part 2 — "hio multi-product
  architecture & migration"). This file supersedes that scratch document for day-to-day work.
- **Companion docs:** [`EXPLORATION-COMPARISON.md`](EXPLORATION-COMPARISON.md) (why each piece
  was reused), [`TENANCY.md`](TENANCY.md) (the multi-tenant model), [`ENVIRONMENTS.md`](ENVIRONMENTS.md)
  (dev/prod tiers). Engineering rules live in [`../CLAUDE.md`](../CLAUDE.md).

---

## How to use this roadmap (working agreement)

**This roadmap is authoritative. Follow it in order.** It is also a living document — the point
is not to be rigid, but to make every change *deliberate and recorded*. The protocol:

1. **Pick up from "Current position"** below. Do the next unchecked step. One milestone step =
   one reviewed PR via the guardrails (hooks → CI → human review).
2. **Do not silently deviate.** If reality suggests a different order, a different scope, or
   dropping/adding a step, **stop and propose it explicitly** — state *what* changes and *why*
   the deviation is required — and get a human decision **before** acting.
3. **Every approved deviation is logged.** Add a dated entry to the [Deviation log](#deviation-log)
   with the reason and its cost/tradeoff. A deviation without a logged reason is a bug.
4. **Keep status honest.** Update the checkboxes and "Current position" in the same PR that does
   the work, so anyone can resume cold from this file alone.

> There is no automated gate that can judge "did you follow the roadmap" — it's a semantic call.
> Protection is therefore social + documentary: this agreement, the rule in `CLAUDE.md`, and the
> deviation log. Honor them.

---

## Status legend & current position

`✅ done` · `🔵 in progress` · `⬜ not started` · `↪ moved` (see deviation log)

- **Status check 2026-11-26 (after a ~4-month pause):** no code merged since PR #70 (2026-07-15).
  The dev Supabase project had auto-paused and was restored by the owner; data and `ai-command` v12
  intact. A short **clean-up + security pass** ran before INFRA (see the Deviation log's
  `2026-11-26` entries): done, with migrations `016` + `017` merged (#76, #77). **Now: a Design & UX
  review** before INFRA (Deviation log, "Design & UX review before launch"). PR #78
  (`integration/v2` → `main`) is held as a draft until that review is signed off. PR #73 (design
  tokens) is decided inside the review.
- **Now:** **M4 feature-complete + the page→tenant rewrite fully landed (expand → migrate → CONTRACT done).
  Legacy `pages`/`page_id` no longer exist anywhere — the path to prod is now pure infra.**
  M2 + M3 are complete and the `ai-command` **v7** bundle is deployed + live-verified on dev (one unified
  `{tenant_id,site_id}` path for both products; the legacy `{page_id}` shape is gone). **All M4 features
  (M4.1–M4.8) are done** — Studio has the full create → build → AI-edit → publish → public-render →
  version/rollback → custom-domain loop on the shared engine — the **Self-Serve MIGRATE phase (PRs A/B/C,
  #25–#27) is done**, the **admin slug fix (`013`, #29) is done**, and the **CONTRACT phase (`014`) is done**:
  `pages` + `sections.page_id` + the legacy page-based section policies + the dead `reorder_sections` RPC are
  dropped, `sections.tenant_id/site_id` are NOT NULL, and `handle_new_user`/`create_studio_client` no longer
  touch `pages`. **M4.1 (tenancy schema, expand phase) done** — unified `tenants`/`tenant_members`/`sites`
  + `sections.tenant_id/site_id`, existing Self-Serve pages backfilled, membership RLS (migration `007`,
  applied to dev; backfill verified 0 orphans). **M4.2 (provider resolution) done** —
  `@hio/content-model@1.1.0` adds `MODULE_REGISTRY` + `resolveProvider`/`resolveVariant`, resolving a
  per-tenant `SchemaProvider` from a tenant's `schema_variant` bundle (zero engine change). **M4.3
  (Studio shell + team auth + agency dashboard) done** — `apps/studio` with login-only team auth, an
  `is_admin`-gated dashboard, and the `create_studio_client` RPC (migration `008`) behind a New-client
  form + per-client settings; verified live on dev. **M4.4 (per-client builder) done** — Studio
  `/clients/[id]/builder` with membership-gated section CRUD, the add-module palette resolved per client
  via `resolveVariant`, reusing `@hio/ui`; verified live. **M4.5 (generalized `ai-command`) done** — one
  tenant-aware edge function (deployed dev v5) serves both products, resolving the per-client provider by
  request shape; Studio builder got a ChatSidebar; both paths live-verified. **M4.6 (theme + public render)
  done** — `get_public_site` RPC (migration `009`) + Studio `/sites/[slug]` route applying the per-tenant
  theme via `@hio/ui`, with a publish toggle; verified live. **M4.7 (version history) done** — `site_versions`
  whole-site snapshots (migration `010`) with `snapshot_site`/`restore_site_version` RPCs; captured on
  publish + manual save; restore auto-snapshots first; verified live.
- **Next action:** **INFRA — the path to prod, after the Design & UX review is signed off** (the page→tenant rewrite is fully done; admin slug `013`
  + CONTRACT `014` both landed). **Netlify repo-link + auto-deploy from `integration/v2` is confirmed
  working** (both sites deploy clean on every push — verified 2026-07-04 against PR #51/#52's merges).
  Remaining is mostly owner accounts/decisions — propose, don't assume:
  **(1)** create the **prod** Supabase project in a **separate account** (per `ENVIRONMENTS.md`), fill
  `SUPABASE_PROD_REF`; **(2)** confirm Self-Serve's `SUPABASE_SERVICE_ROLE_KEY` server secret is set and
  the intended production domains (`app.hio.space`/`studio.hio.space` + M4.8 client domain aliases) are
  mapped — see `hio-netlify-deploy`; **(3)** arm `PROD_DB_DEPLOY_ENABLED=true` + the prod GitHub Actions
  secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROD_REF`, `SUPABASE_PROD_DB_PASSWORD`); **(4)** promote
  `integration/v2` → `main` (PR #78) so CI runs the 18 migrations (`0000`–`017`) against prod and Netlify deploys production.
- **In parallel (widening M2) — now complete.** `contact` ✅ · `services` ✅ · `gallery` ✅ ·
  `testimonial` ✅ · `custom` ✅ done — **all 9 module types built.** Drag-and-drop reorder ✅ done
  (both builders, PR #42). **shadcn/Tailwind migration ✅ fully done** (PR #44 spike + PR #47 the
  other 8 renderers + PR #48 both apps' builder chrome) — every `@hio/ui` renderer and both
  builders' chrome are now on Tailwind utilities, mechanical parity with the old inline-style look
  confirmed live. **Per-site theming MVP ✅ done** (PR #52 — accent/font/rounding pickers in both
  apps, writing the existing `tenants.theme` JSONB; see "Module build-out" below for detail).
  **M2-widening is now fully wrapped.** **Public-site visual identity ✅ done** (out-of-sequence,
  owner-directed — see the Deviation log's `2026-07-05` entry): a shared stone/slate/primary
  default look for both products' published pages, plus content-appropriate per-module layouts.
  **Manual collection-item editing ✅ done** (PRs #55 + #57, merged — see the Deviation log's
  second `2026-07-05` entry): fixes the gap the visual-identity work surfaced — the builder's
  "Edit" button could only touch string fields, so services/gallery/testimonial/calendar/links
  items were only addable via AI chat. (PR #56 was auto-closed when its base branch, #55, was
  deleted on merge — GitHub closes a dependent PR instead of retargeting it. Recreated as #58,
  then closed as superseded once #57's branch was retargeted straight to `integration/v2` and
  found to already contain the complete stack — shared pieces + both apps' wiring — merged as a
  single commit with no duplicate content.)
  **"Warm Blueprint Brutalism" visual direction ✅ done** (out-of-sequence, owner-directed —
  see the Deviation log's third `2026-07-05` entry): replaces the stone/slate/primary public-page
  look from the visual-identity PR with a technical-drawing scaffold system, and introduces
  `tenants.theme.style` as a swappable "look system" dimension (the old look survives as the
  picker's second option, `stone-slate`).
  Next: **INFRA/path-to-prod** (see "Next action" above).
- **Branch model:** work happens on `integration/v2`; it becomes `main` when v2 is ready.

---

## Locked decisions

- **Two products, one engine.** hio Self-Serve (self-register page builder, free + paid tiers) and
  hio Studio (agency-managed custom client sites) share one **schema-driven AI editor**.
- **Studio runs on hio's own Next.js + section engine** — no external/WordPress stacks.
- **Build order:** Self-Serve first → extract & freeze the core → Studio.
- **Monorepo:** npm workspaces + Turborepo; two Netlify free sites; one Supabase org (dev + prod).

---

## Target architecture

```
hio-main/                      # root holds the guardrails (.claude, .github, CLAUDE.md, .mcp.json)
├─ apps/
│  ├─ self-serve/             # Next.js — Product 1 (built-in schema, tiers, /[slug] public pages)
│  └─ studio/                 # Next.js — Product 2 (agency dashboard, per-client theme/schema)
├─ packages/
│  ├─ ai-engine/             # schema-driven AI editor (product-agnostic core)
│  ├─ content-model/         # content types + the SchemaProvider interface (THE pluggable seam)
│  ├─ ui/                    # design system: section renderers (+ shadcn/tokens, in progress)
│  └─ db/                    # shared Supabase client/types
├─ supabase/                 # one schema, shared migrations + edge functions
├─ turbo.json                # Turborepo task graph; npm workspaces
└─ netlify config            # two Netlify sites, base dir per app
```

## The pluggable seam (the core technical idea)

- `packages/content-model` exports the typed `*Content` schemas (Zod) **plus** the `SchemaProvider`
  interface — `{ modules, getModule, allTools }` where each `ModuleDefinition` carries its content
  schema, defaults, and `AiToolDescriptor[]`.
- `packages/ai-engine` **generates Claude tool declarations from the active `SchemaProvider`**
  (not a hard-coded list), validates input server-side against the Zod schemas, and applies each
  mutation through an abstract persistence port. Security-critical wiring (JWT verify, ownership
  check, service-role isolation, prompt caching, protected-field guard) lives in the edge function.
- **Self-Serve** registers one built-in `SchemaProvider`. **Studio** resolves a `SchemaProvider`
  **per client** (theme + allowed modules + per-client tools). One engine, two products.

---

## Milestones

### M1 — Monorepo + stack alignment ✅
npm workspaces + Turborepo; guardrails at root; `apps/{self-serve,studio}` + `packages/{ai-engine,
content-model,ui,db}` scaffolded and building; `ci.yml` runs `turbo run lint typecheck test build`.

### M2 — Self-Serve port (builder → guarded Next) ✅ (gate met; widening backlog deferred)
Bring the builder's schema/RLS/auth/modules/AI editor onto the guarded Next.js stack. The milestone
gate is met (shipped + verified live end-to-end); the remaining module renderers, drag-and-drop, and
shadcn restyle listed under "Module build-out" below are **deferred enhancements**, not blockers.

- **M2.1 — Schema** ✅ migrations `001–006` (RLS, triggers, auto-provision, tiers, hardening) applied
  to dev; `@hio/db` typed.
- **M2.2 — Auth** ✅ Supabase SSR email/password (signup/login/logout) + protected `/dashboard`;
  signup auto-provisions a page + hero via trigger. Verified live.
- **M2.3 — Module system** ✅ `content-model` (schemas + `ModuleDefinition` + `selfServeSchema`
  provider) and `@hio/ui` renderers (Hero/Bio/Links + `ModuleRenderer`).
- **M2.4 — Clickable builder** ✅ `/builder` with server actions (add/update/delete/reorder, the
  last via the `reorder_sections` RPC), `SectionEditor`, and public read-only `/[slug]`. Verified live.
- **M2.5a — AI editing vertical** ✅ *(merged, #6)* schema-driven `@hio/ai-engine`
  (`buildClaudeTools` via `zod-to-json-schema`, protected-field guard, `executeTool` over a
  `SectionStore` port, 13 Vitest tests); the `ai-command` Deno edge function delegating to it; and
  `ChatSidebar` in the builder. **Note:** this absorbs M3's "schema-driven engine" work — see
  [deviation log](#deviation-log).
- **M2.5b — Tiers + admin** ✅ *(merged, #8)* admin-gated `/admin` console: per-user tier `free↔paid`
  + `module_overrides` grants, via Zod-validated server actions enforced by the existing
  `settings_update_admin` RLS policy. No migration — the `is_admin` flag + admin RLS already existed
  (migrations `001`/`004`). Dashboard shows an Admin link to admins. Verified live (non-admin gate,
  admin view, write path).
- **M2.6 — Deploy + live verify** ✅ `ai-command` deployed to dev (v3, `verify_jwt: true`). The AI
  editor is **proven end-to-end live**: a natural-language prompt in the ChatSidebar → Claude Haiku →
  tool-gated `update_module_content` → service-role write → persisted (hero headline changed in the
  DB). De-risks the Deno↔workspace-package wiring. `ANTHROPIC_API_KEY` was already set on the dev
  project (carried over from the hio-builder exploration, which used the same Supabase project).
  **Follow-up ✅ (reconciled in M3 PR-2):** the two deploy paths are unified by a bundling step.
  `npm run bundle:ai-command` vendors the `@hio/*` packages into
  `supabase/functions/ai-command/vendor/` (source of truth stays the packages), and `deno.json`
  imports `@hio/*` from there. The committed function is now **self-contained and identical to what
  deploys** (MCP flat upload or CLI alike); the `edge-bundle` CI job fails on any drift between the
  vendored copies and the packages. See `supabase/functions/ai-command/README.md`.

**Module build-out (widening M2):** `calendar` ✅ done
(renderer + `add_event`/`update_event`/`remove_event` AI tools — first module to exercise the
engine's `updateItem` op; paid-tier gated). `contact` ✅ done (`@hio/content-model@1.2.0`: `contactSchema`
+ `contactModule` registered + added to the `self-serve` bundle; `@hio/ui` `ContactModule` renderer; a
plain-text **free-tier** module — closes the gap where the DB `allowed_module_types()` listed `contact`
free but no module existed; edited by the built-in `update_module_content`, no new AI tools; vendor
re-bundled + ai-command redeployed **v8**; verified live: REST insert under the self_serve RLS, AI title
edit via v8 → DB-persisted, public `/[slug]` renders it). `services` ✅ done (`@hio/content-model@1.3.0`;
collection module with `add_service`/`update_service`/`remove_service`, PR #38). `gallery` + `testimonial`
✅ done (`@hio/content-model@1.4.0`): `gallery` = image-URL grid with `add_image`/`update_image`/`remove_image`
(no upload pipeline — Supabase Storage upload is a future enhancement); `testimonial` = quote list with
`add_testimonial`/`update_testimonial`/`remove_testimonial`. Both paid-gated by RLS. **ai-command redeployed
v9**; all three (services/gallery/testimonial) live-verified end-to-end on dev (REST insert → AI add-item →
DB-persisted → public `/[slug]` renders). `custom` ✅ done (`@hio/content-model@1.5.0`, PR #40): the escape
hatch — `title` + a markdown `body`, no new AI tools (edited via `update_module_content`, same as
`contact`/`bio`). `@hio/ui`'s `CustomModule` renders `body` via `react-markdown` with no `rehype-raw`
plugin, so pasted HTML/`<script>` tags render as inert text — a markdown renderer, not an HTML renderer.
Paid-gated by RLS; no migration (the DB `allowed_module_types()` already listed `custom`). **ai-command
redeployed v10**; live-verified end-to-end (REST add/edit + AI title edit, both DB-persisted; an XSS probe
with `<script>`/`<img onerror>` in the body confirmed inert — no execution, no injected DOM node). **All 9
module types are now built.** Drag-and-drop reorder ✅ done (PR #42): both builders replace the ↑/↓
swap buttons with a drag handle (⠿) using native HTML5 drag events (no new dependency).
`computeReorder(secs, sectionId, toIndex)` walks the existing `computeSwap` adjacent-swap helper one
step at a time to the drop index, so the DB writes are the exact same membership-gated per-row
order-value updates as before — no RPC, no schema change. Self-Serve's swap logic (previously inlined
in `actions.ts`) was factored into its own `reorder.ts` to match Studio's existing pattern; both now
colocated-tested (12 Vitest each). Live-verified end-to-end in both apps: dragging a section to an
arbitrary position persists (confirmed via a fresh reload), then test data reverted. shadcn/Tailwind
spike ✅ done (PR #44): scoping found **no Tailwind/shadcn/PostCSS existed anywhere in the repo** —
every renderer + builder chrome was 100% inline `style={{}}`; `@hio/ui`'s `cn()` was an unused
forward-looking utility. Rather than a component swap, this bootstrapped the pipeline from scratch:
Tailwind v4 wired via `@hio/ui/src/globals.css` (design tokens through `@theme`, exported as
`"@hio/ui/globals.css"`, with `@source "./modules"` so Tailwind scans this package's components
from either app) + `postcss.config.mjs` in both apps + the shared stylesheet imported in both root
layouts. `cn()` moved to its own `cn.ts` (avoids a circular import). `ContactModule` migrated onto
Tailwind utilities as the proof point, and `StyleVariant` (`minimal/bold/outlined/filled` —
previously accepted by every renderer but never used) now maps to a real card treatment. Live-
verified: both apps compile clean; the migrated renderer's computed styles confirmed correct in the
builder and on the public `/[slug]` page. **All three Active-track items are now merged** (`custom`,
drag-and-drop, this spike). shadcn/Tailwind migration **fully complete** (PR #47 + PR #48, both
2026-07-04): PR #47 migrated the other 8 renderers (`Hero`/`Bio`/`Links`/`Calendar`/`Services`/
`Gallery`/`Testimonial`/`Custom`) plus `ModuleRenderer`'s fallback onto Tailwind utilities, extracting
the `StyleVariant` → card-treatment mapping (`cardClasses`/`headingClasses`) into a shared
`packages/ui/src/variant.ts` reused by every renderer. PR #48 did the same for both builders' chrome
(`BuilderCanvas`/`StudioBuilderCanvas`, `SectionEditor`/`StudioSectionEditor`, both `ChatSidebar`s) —
completing the roadmap's stated scope ("`@hio/ui` renderers + builder chrome"). Both PRs were a
**mechanical migration, not a redesign**: pixel values map to the closest standard Tailwind scale
where one exists, and to bracket arbitrary values (e.g. `max-w-[720px]`, `rounded-[6px]`) where the
original number doesn't hit the standard scale — confirmed via computed-style inspection to match
the pre-migration inline styles exactly. Live-verified end-to-end in both apps (every module type
added to a test page/client, builder chrome — drag handles, section editor, AI chat — exercised, no
console errors), then all test data cleaned up. **The shadcn restyle item is now fully done — nothing
left in the M2-widening track.**

**Per-site theming MVP ✅ done (PR #52) 2026-07-04.** Curated-only (no free color picker, no font
upload, no per-module overrides) — deliberately narrow, per the owner's stated intent to widen later.
Reused the theme mechanism Studio already had (`tenants.theme` JSONB + `parseSiteTheme`/`themeToStyle`,
M4.6) rather than inventing new storage; **no migration** — the column and its `tenants_update_member`
RLS policy already covered both tenant kinds. `@hio/ui`'s `SiteTheme` gained a `radius` preset;
`themeToStyle` now feeds `--color-primary`/`--color-primary-foreground`/`--radius-card` so the
existing `bg-primary`/`text-primary-foreground`/`rounded-card` utilities resolve per site at runtime
without Tailwind regenerating any CSS. New `ACCENT_SWATCHES`/`FONT_STACKS`/`RADIUS_PRESETS`/
`DEFAULT_THEME` exports back a picker (swatches + 2 dropdowns) added to both apps: Self-Serve got a
new `/settings` page (linked from `/dashboard`) + a server action, the tenant's first-ever theme
write path (Studio-only until now); Studio got a `ThemeForm` on the client settings page, reusing the
custom-domain feature's write pattern. Self-Serve's `/[slug]` public page and `/builder` now apply the
theme; `/[slug]` switched from a direct `sites`/`sections` query to the anon-callable `get_public_site`
RPC (M4.6, already generic — not Studio-specific) so it can read the tenant's theme, which member-only
`tenants` RLS hides from anon directly. **Bug found + fixed while live-verifying:**
`packages/ui/src/globals.css`'s Tailwind `@source` scan only covered `./modules`, missing
`variant.ts` (one directory up) — the file that actually spells out the `outlined`/`filled`/`bold`/
`rounded-card` utility-class strings every renderer calls through `cardClasses`/`headingClasses`.
Those utilities were silently never generated by Tailwind since the shadcn migration (PR #47/#48);
added `@source "./variant.ts"`. Live-verified on dev (both apps' pickers persist to `tenants.theme`;
computed styles confirmed `--color-primary`/`--radius-card` resolve on the public page and in the
builder — a temporarily-added hero CTA button and a temporarily-outlined bio card rendered with the
chosen accent color and pill radius respectively, proving the CSS-variable wiring end-to-end, not
just the DB write); test data reverted after. **Next: INFRA/path-to-prod** (see "Next action" above).

### M3 — Extract, generalize & **freeze** the core ✅ (engine generalized in M2.5a; freeze + deploy reconcile done)
The engine was made schema-driven with Vitest coverage in M2.5a. The remaining, non-skippable work
was the **seam-freeze gate**: a deliberate review ratifying that the `SchemaProvider` /
`AiToolDescriptor` contract is good enough for Studio to build on without churning it.

- **M3 freeze ✅ (PR-1):** `content-model` frozen at **`@hio/content-model@1.0.0`** with
  [`CONTRACT.md`](../packages/content-model/CONTRACT.md) (the frozen surface + change protocol) and a
  regression-guard contract test that proves a swapped provider yields a different toolset with **zero
  engine code change**. Pre-freeze hardening: `createSchemaProvider` enforces unique module types,
  unique AI tool names, and no collision with reserved engine tools; `defaultContentFor` takes a
  provider. **Gate decisions** (recorded in `CONTRACT.md`): module-type space is **CLOSED** (`custom`
  is the escape hatch; opening it is deferred to M4+); **theme is OUT** of content-model — it is
  presentation, so `StyleVariant` moved to `@hio/ui`; "allowed modules" = `provider.modules`, enforced
  per product (Self-Serve tier RLS; Studio per-client provider + future tenancy RLS).
- **M3 deploy reconciliation ✅ (PR-2, #12):** the M2.6 follow-up is closed. `npm run bundle:ai-command`
  vendors the `@hio/*` packages into `supabase/functions/ai-command/vendor/` (source of truth stays the
  packages) and `deno.json` imports from there, so the committed function is self-contained and
  identical to what deploys (MCP flat upload or CLI). The `edge-bundle` CI job fails on any drift. See
  the function's `README.md`. **Verified:** regenerated bundle redeployed to dev as **v4** and the AI
  editor re-tested live end-to-end (hero headline edited via the function → persisted).

### M4 — Studio (build on the proven core) 🔵
New `apps/studio`: agency dashboard over the **unified tenant model** from [`TENANCY.md`](TENANCY.md) —
a self-serve user's space and a Studio client are both `tenants` (by `kind`). Studio resolves a
`SchemaProvider` per client (reusing `ai-engine` unchanged), with per-client publishing, custom domains,
and version history. Decisions ratified 2026-06-21 (see [deviation log](#deviation-log)): **unified
model** (not the roadmap's original `clients`/`client_sites` naming), **big-bang** (Self-Serve migrated
onto tenants too, via expand→migrate→contract), **one generalized** tenant-aware edit function, and
**custom domains in scope**.

- **M4.1 — Tenancy schema (expand)** ✅ migration `007`: `tenant_kind` enum, `tenants`,
  `tenant_members`, `sites`; `sections` gains nullable `tenant_id`/`site_id` (and `page_id` made
  nullable for Studio sections); existing Self-Serve pages backfilled into tenants/sites; membership
  RLS (`is_tenant_member`) with a **studio-scoped** section-write policy so Self-Serve's tier gate is
  untouched. Applied to dev; backfill verified (0 orphan sections). `@hio/db` types regenerated.
- **M4.2 — Provider resolution** ✅ `@hio/content-model@1.1.0` (additive/minor): `MODULE_REGISTRY`
  (built modules keyed by `ModuleType`), `MODULE_BUNDLES` (named module sets keyed by
  `tenants.schema_variant`), `resolveProvider(id, enabledTypes)` + `resolveVariant(id, variant)`
  building a per-tenant `SchemaProvider` over `createSchemaProvider`. `selfServeSchema` now expressed
  via the registry/bundle. Storage **sub-decision (ratified 2026-06-21):** a tenant's enabled-module
  set is its **`schema_variant` named bundle** (no new column) — a granular `enabled_modules` override
  stays a future *additive* option; this is what `create_studio_client` (M4.3) sets. Tests in
  `content-model`'s `index.test.ts` prove a resolved provider exposes only the enabled modules' tools;
  `contract.test.ts` stays green; `CONTRACT.md` change-log updated; vendor bundle regenerated.
- **M4.3 — Studio shell + team auth + agency dashboard** ✅ (split into 4.3a/4.3b for reviewable PRs,
  per the M2 precedent — same "each step = a reviewed PR" principle, no scope change):
  - **M4.3a — Shell + team auth + read-only dashboard** ✅ `apps/studio` gains the Self-Serve
    scaffolding (`lib/env` [public Supabase pair only], `lib/supabase/{server,client}`, `middleware`),
    **login-only** team auth (no public signup — agency staff are provisioned users), and a protected
    `/dashboard`. **Authz sub-decision (ratified 2026-06-21):** agency staff = the existing
    `user_settings.is_admin` flag (reused, no new table); a non-staff user who authenticates is gated to
    a "No Studio access" state. The dashboard lists `kind='studio_client'` tenants the caller belongs to
    (RLS `tenants_select_member`), empty until 4.3b. No migration. Verified live (login form renders;
    admin test user → empty client list; staff gate exercised). Colocated Vitest on the credentials schema.
  - **M4.3b — `create_studio_client` RPC + "New client" + per-client settings** ✅ migration `008`:
    SECURITY DEFINER `create_studio_client(name, slug, schema_variant, theme)` — internally **admin-gated**
    (`is_admin`), validates name/slug + rejects taken slugs, then inserts tenant (`kind='studio_client'`)
    + caller-as-owner membership + unpublished site + seeded hero (the template), returning the tenant id.
    `EXECUTE` revoked from `anon` (Supabase default-priv grant) so only `authenticated` may call it.
    Studio UI: `/clients/new` form (name/slug/`schema_variant` from `MODULE_BUNDLES`) → RPC → redirect to
    `/clients/[id]` settings (rename + change variant via an RLS-gated `tenants` update); dashboard lists
    clients linking to settings. Applied to dev; **verified live** end-to-end (create → list → rename) +
    SQL-level gate tests (no-auth 28000, non-admin 42501, dup-slug 23505). `@hio/db` types regenerated.
    Colocated Vitest on the form schemas.
- **M4.4 — Per-client builder** ✅ `apps/studio` `/clients/[id]/builder`: tenant-membership-gated
  section CRUD reusing `@hio/ui`'s `ModuleRenderer`. The add-module **palette is resolved per client**
  via `resolveVariant(tenant.schema_variant)` (the seam in action — not a hard-coded list); sections are
  keyed on `site_id`/`tenant_id` (`page_id` NULL) and every write rides the `sections_write_studio_member`
  RLS (membership-gated, `kind='studio_client'`). Add/edit/delete + reorder (RLS-gated order-value swaps,
  since the existing `reorder_sections` RPC is page-keyed; the swap logic is a pure, unit-tested helper).
  No migration. Verified live on dev end-to-end (add → reorder → edit → delete; DB-confirmed).
- **M4.5 — Generalize `ai-command`** ✅ the one edge function now serves **both products**, selecting
  provider + sections by request shape: `{ page_id }` → Self-Serve (page-ownership + `selfServeSchema`,
  unchanged) · `{ tenant_id, site_id }` → Studio (tenant-membership check + `resolveVariant(schema_variant)`,
  sections by `site_id`). A `resolveTarget()` helper enforces the boundary by hand (service role bypasses
  RLS); the engine code is identical for both. Studio builder gained a `ChatSidebar` (the studio AI caller).
  **No engine/content-model change** (engine already provider-driven; `resolveVariant` already vendored).
  Redeployed to dev as **ai-command v5** (MCP, `verify_jwt:true`); **both paths live-verified** end-to-end
  (Studio: ChatSidebar edited a client's hero → DB-confirmed; Self-Serve: authenticated REST `page_id`
  edit → DB-confirmed). README updated with the dual-mode contract.
- **M4.6 — Theme application + public site rendering by slug** ✅ migration `009`: `get_public_site(slug)`
  SECURITY DEFINER RPC (anon-callable, pinned `search_path`) returns ONLY a **published** site's public
  fields — title, tenant name + `theme`, ordered sections — so anon renders without exposing the
  member-only `tenants` row (chosen over a public tenants RLS policy to avoid leaking plan/schema_variant).
  Studio public route `/sites/[slug]` renders the sections via `@hio/ui`'s `ModuleRenderer` and applies the
  tenant `theme` (new `SiteTheme` + `parseSiteTheme`/`themeToStyle` in `@hio/ui` → background/text/font +
  `--site-accent`); unpublished/unknown slugs 404. A publish/unpublish toggle + public URL on the client
  settings page (RLS `sites_write_member`). Verified live on dev (themed public page rendered; toggle
  persisted; unpublished → 404). `@hio/db` types regenerated.
- **M4.7 — Version history / rollback** ✅ migration `010`: `site_versions` table (whole-site JSONB
  snapshot of all sections), membership-gated RLS (`site_versions_select_member`; writes only via the RPCs).
  `snapshot_site(site_id, label)` + `restore_site_version(version_id)` (SECURITY DEFINER, pinned
  `search_path`, membership-gated, anon-revoked). **Decision (ratified):** whole-site snapshot (not
  per-section); captured **on publish + manual "Save version"**. Restore **auto-snapshots the current state
  first** ("Before restore"), then atomically replaces the sections — so a restore is itself reversible.
  Studio settings: a Version history list (newest-first) with Save version + per-version Restore; publish
  auto-captures a "Published" version. Verified live + SQL (snapshot, restore reverts + auto-snapshot,
  publish→"Published" version, non-member → 42501, cascade delete leaves 0 orphans). `@hio/db` types regen.
- **M4.8 — Custom domains** ✅ migration `011`: `tenants.custom_domain` (one domain per tenant —
  nullable, UNIQUE, hostname CHECK) + `get_public_site_by_domain(host)`, an anon SECURITY DEFINER
  sibling of `get_public_site` keyed on the domain (published-only, no tenant-row leak). **Sub-decision
  (ratified 2026-06-21):** a single `custom_domain` column over a separate `domains` table (lightest,
  matches TENANCY.md's singular "map a domain"; a multi-alias/verification table stays a future additive
  option), resolved by **Next.js middleware + the by-domain RPC** (no edge function). `apps/studio`
  middleware rewrites any non-app Host to `/hosted` (a host-reading render route reusing the M4.6
  `PublicSiteView`), so a client's domain renders ONLY its published site and never the agency app;
  `lib/hosts.ts` classifies app vs custom hosts (localhost / `*.netlify.app` / `NEXT_PUBLIC_STUDIO_APP_HOSTS`).
  Client settings gained a Custom-domain form (`tenants_update_member` RLS, dup-domain → friendly error).
  Real DNS/cert provisioning is a Netlify dashboard step (add the domain as an alias on the Studio site).
  Verified live on dev: mapped+published host → 200 themed render, deep paths on it also render the site
  (not the app), unknown host → 404, app host → /dashboard; RPC checked as `anon` (exact + case-insensitive
  match, published-only filter). `@hio/db` types regenerated.
- **Self-Serve MIGRATE phase (unblocks CONTRACT)** 🔵 — switch the live Self-Serve product off
  `pages`/`page_id` onto the unified `sites`/`sections` keys. Data is already dual-keyed (007 backfill +
  `handle_new_user` seeds both), so this is a code+RLS switch, **phased into 3 PRs** (ratified 2026-06-21):
  - **PR A — membership write RLS** ✅ migration `012`: additive `self_serve`-scoped section policies
    (`sections_{insert,update,delete}_self_serve_member`) keyed on `is_tenant_member(tenant_id)` for
    `kind='self_serve'`, **preserving the tier gate** (`allowed_module_types()` on insert) and
    `is_active_user()` on update. Runs alongside the legacy page-based policies (no behavior change yet).
    Applied to dev; SQL-verified (member insert-by-site_id with `page_id` NULL + update + delete pass;
    non-member → 42501; free user + paid module → 42501). No type change.
  - **PR B — app switch** ✅ `apps/self-serve`: `requirePage`→`requireSite` (resolves the caller's
    self_serve tenant + site via membership-scoped RLS); builder/dashboard/`[slug]`/`actions.ts` now
    query + write by `site_id`/`tenant_id`; reorder via order-value swaps (the page-keyed
    `reorder_sections` RPC is unusable for site rows). The AI ChatSidebar still posts `{page_id}`
    (transitional — generalized in PR C). Verified live on dev (login → dashboard/builder via site path;
    add module persisted with `page_id` NULL + `site_id`/`tenant_id`; reorder swap DB-confirmed; public
    `[slug]` renders all modules via `sites`; unknown slug → 404).
  - **Admin slug fix ✅** migration `013`: extends the admin-gated `get_auth_users_for_admin` RPC
    (SECURITY DEFINER) to also return each user's self_serve `sites.slug`, so `admin/page.tsx` labels
    users from the RPC instead of the world-readable `pages` table. `EXECUTE` revoked from anon/PUBLIC,
    search_path pinned. Verified live (4 users + correct slugs) + SQL (non-admin rejected). This was the
    **last `pages`/`page_id` reference in app code** — unblocks CONTRACT.
  - **PR C — ai-command** ✅ generalize the `{tenant_id, site_id}` branch to accept any tenant the caller
    is a member of — the only change is dropping the `kind='studio_client'` filter, so a `self_serve`
    tenant resolves via `resolveVariant('self-serve')` (≡ `selfServeSchema`). Self-Serve ChatSidebar now
    sends `{tenant_id, site_id}`; the builder no longer looks up `pages` at all. No `@hio/*` change → vendor
    bundle unchanged. **Redeployed to dev as ai-command v6** (MCP `deploy_edge_function`, `verify_jwt:true`,
    inline incl. vendor/*; needs `import_map_path: deno.json`). **Live-verified end-to-end**: the self_serve
    `{tenant_id, site_id}` path edited the test user's hero → DB-persisted; the legacy `{page_id}` path
    still works (backward-compatible). Self-Serve no longer depends on `page_id` except the `admin/page.tsx`
    slug label (below).
- **CONTRACT phase (late M4)** ✅ migration `014` + `ai-command v7`: the destructive end of the
  expand → migrate → contract rewrite. Dropped the 4 legacy page-based section policies
  (`sections_{delete,update}_own`, `"Users can insert own sections"`, `"Public can read sections"` —
  superseded by the `*_self_serve_member` (012) + `*_studio_member` (007) policies), set
  `sections.tenant_id/site_id` **NOT NULL**, dropped `sections.page_id` (FK + unused index), dropped the
  dead page-keyed `reorder_sections` RPC (both products reorder via order-value swaps), and dropped the
  `pages` table. `handle_new_user` now seeds only tenant + membership + site + hero (no page);
  `create_studio_client` lost its `pages` slug check. **`ai-command` redeployed dev v7** — the legacy
  `{page_id}` branch removed, every request is `{tenant_id, site_id}`; engine `PROTECTED_FIELDS` swapped
  `page_id` → `tenant_id`/`site_id` (vendor re-bundled). **Verified live**: self_serve `{tenant_id,site_id}`
  edit → DB-persisted; legacy `{page_id}` request → "Missing tenant_id + site_id"; non-member → "Not found";
  new-user provisioning (trigger) creates tenant/site/hero with **no page** (throwaway user, cleaned up);
  advisors show all `pages`/`page_id` findings gone, no new issues. `@hio/db` types regenerated.
  **`pages`/`page_id` now exist nowhere in the system.**

---

## Deviation log

Every approved departure from the original plan, with its reason and cost.

### 2026-11-27 — Sign-up and password emails done properly (owner-reported, F24 + part of F17)
**Change:** the owner signed up on dev with an email that already had an account and got
"Account created — check your email" but no email. Supabase deliberately sends nothing on a
repeated sign-up (it hides whether an account exists), and the app had no confirm route, no resend
and no password reset. Fixed in Self-Serve:
- a "Check your inbox" screen after sign-up, with a Resend button (once a minute) and, always, "Already
  have an account? Log in or reset your password". It's the same screen in both cases, so it never
  reveals whether an account exists;
- an `/auth/confirm` route that signs the user in from an email link (both `token_hash` and `code`
  links) and opens the dashboard with a welcome. Only our own paths are allowed as the next page;
- Forgot password → reset email → "Choose a new password", which signs out everywhere afterwards;
- plain-language messages for every auth error instead of Supabase's raw text, with Resend offered
  when an email isn't confirmed.
No migration. **Owner settings** (in `ENVIRONMENTS.md`, "Auth emails"): add `/auth/confirm` to
Supabase's Redirect URLs. Recommended: switch the two email templates to `token_hash` links.
**Before launch** (Phase 4): connect a real email service, because Supabase's built-in sender is for
testing only. **Why:** a broken first step loses users before they see the product. **Cost:** about
half a day. **Not done:** an account settings page (the rest of F17), and Studio's staff login,
which still uses the old messages.

### 2026-11-27 — Site look: page width, working rounding, and a rebuilt editor (owner-directed)
**Change:** the owner asked for (1) a page-wide width setting in Site look: full screen with no
margin, or a margin of about 10%, 20% and so on, alongside the per-section widths; (2) a fix for
Rounding, which did nothing; and (3) a usability review of the whole Site look page. Built as one
system, with no migration (new keys in the existing `tenants.theme` JSONB, existing RLS):
- **Page width** (`theme.pageWidth`): Classic (the old fixed 1024px column, the default, so stored
  sites don't change), Full screen, Wide 5%, Comfortable 10%, Roomy 15%, Narrow 20%. One CSS token
  (`--margin`, `--sheet-max`); phones keep 16px. Design rule 9 added (width is one token; running
  text stays near 65 characters).
- **Rounding:** broken by design rule 5 (square corners), which zeroed every radius. The rule is
  now "the grid is square; Rounding is for buttons and pictures". Presets: Sharp / Soft / Round,
  and the old "pill" is read as Round.
- **Paper** colour preset (Style default / White / Warm / Cool): the theme already had a
  background field but no control for it. Curated light papers keep each style's text readable.
- **Editor:** one shared `SiteLookForm` (`@hio/ui/admin`) replaces the two copies (Self-Serve
  Settings, Studio client page). It has controls grouped as Layout / Colour / Type / Details and
  shown as pictures. The preview runs at real desktop width (scaled) or phone width, shows the
  site's own sections, and restyles by message instead of reloading. It adds Discard, Reset to
  default, a warning on leaving with unsaved changes, and an Open your page link.
- **One helper** (`sitePageProps`) now builds every page's wrapper class and tokens: the public
  page, the Studio page and custom domain, and both previews. Before, four places built them by hand.
**Why:** the owner's direct requests; the rounding bug came from the design-rules pass and is
fixed at the rule. **Cost:** about two days; no migration, no RLS change. **Not done:** a single
section breaking out to full screen inside a narrower page (F3). That needs a presentation column
and an updated `get_public_site`, so it remains a separate, migration-gated item.

### 2026-11-27 — Builder: collapsible sections and a left component toolbar (owner-directed)
**Change:** after reviewing the design pass, the owner asked for two builder changes that were not
in the Design & UX findings: sections that collapse, and a toolbar on the left listing the
components to add, replacing the "Add a section" row above the canvas. Built in the shared
`BuilderCanvas`, so Self-Serve and Studio both get them. Section cards collapse to one line (name
plus a summary such as "My services · 3 services"), with Collapse all / Expand all, and the choice is
remembered per site in the browser. The left pane lists the site's palette with an icon and a short
description. Click a component to add it at the end, or drag it onto a section to insert it before
that section. The pane collapses to a strip like the AI pane; below `lg` it becomes an "Add a
section" disclosure. The add actions in both apps take an optional, Zod-checked position: they
insert at the end, then reuse the existing membership-gated reorder. **Why:** the owner's direct
request; the builder is the screen users spend the most time in. **Cost:** about a day; no
migration, no RLS change. Separate PR stacked on the design pass.

### 2026-11-27 — Design review: Claude reviews and fixes before the owner's walk-through (owner-directed)
**Change:** inside the Design & UX phase, the owner asked Claude to walk the dev site, run audit
agents (public page, editor UX, accessibility) and implement improvements locally overnight,
instead of waiting for the owner's own journey walk (step 2) and a joint triage (step 4). Claude
fixed the findings that were clear defects or direct asks in the owner's brief, on branch
`feat/phase-3-design-polish`, with no database change. The biggest change is layout: published
pages now use the existing `sections.width` column (a 12-column grid, already returned by
`get_public_site`) so sections can sit side by side, with a width control in the builder limited to
each module's range from the schema provider. **Not done (needs a decision):** a full-bleed /
full-screen section option needs a new presentation column and an updated `get_public_site`
(a migration, so its own approval); a real draft/publish step (today every edit is live at once,
now said plainly in the UI); the landing page redesign; password reset; account settings page;
Studio builder width control. **Why:** the owner's brief named concrete defects (clipped service
text, boxed borders, floating dividers, brochure feel) that are cheaper to fix before the walk, so
the owner reviews a better baseline. **Cost:** none to the schedule; the owner still walks and signs
off. **Follow-ups:** the items above are listed in the handbook's Findings table for triage.
**Revision (same day, owner feedback):** the owner was not moved by the first pass: cards were still
boxes inside boxes, the offset shadows had no purpose, gallery captions had dashed lines, corner
lines poked out and the margin pattern didn't line up. Claude replaced the per-module styling with
eight written rules applied to every module and style (`docs/DESIGN-RULES.md`). No scope change.

### 2026-11-26 — Design & UX review before launch (owner-directed)
**Change:** after the security pass, the owner asked for a product review before INFRA instead of
going straight to prod. A new phase walks every user journey on dev (Self-Serve sign-up, builder,
AI edit + Undo, publish + public page, admin; Studio new client, publish, versions, custom domain)
on desktop and phone, adds a first-pass review by Claude (public pages, builder/admin screens,
accessibility basics), and sorts each finding by type (works / UX / look) and priority (must fix
before launch / after launch). The must-fix list is fixed in small PRs into `integration/v2`, then the
owner signs off. PR #73 (design tokens) is decided inside this review. PR #78 (`integration/v2` →
`main`) is held as a draft until sign-off. The checklist and findings log live in the project
handbook. **Why:** nothing has shipped, so changes to screens and flows are cheapest now; launching
first would mean changing them with real users and data. **Cost:** INFRA starts later, by however
long the must-fix list takes. **Follow-ups:** after-launch findings get their own roadmap entries.

### 2026-11-26 — Migration 016: scope changes found while writing it
**Change 1 (security fix beyond the plan):** dev's `user_settings` UPDATE policy allowed
`user_id = auth.uid()`, and with the default table grants any signed-in user could set their own
`is_admin`, `tier`, `is_locked` or `is_disabled`. Every app write to `user_settings` is in the admin
screens, so `016` makes UPDATE admin-only instead of copying the old policy. **Change 2 (drift
captured):** `is_current_user_admin()`, `get_all_user_settings_for_admin()` and the two
"Users can … own settings" policies were applied to dev by hand in May and never committed; `016`
now defines them, so a repo-built database (CI, prod) ends in the same state as dev. **Change 3
(deferred):** leaked-password protection needs the Supabase Pro plan; the dev project is on Free.
Turn it on for prod at launch if prod is on Pro, otherwise when upgrading. **Follow-ups:** review
anon/authenticated `EXECUTE` on the other `SECURITY DEFINER` helpers (`is_current_user_admin` can
now drop anon since its only policies are `to authenticated`; `handle_new_user`, `is_active_user`,
`is_tenant_member`, …); check dev for other hand-applied objects not in the repo.

### 2026-11-26 — Clean-up + security pass before INFRA (owner-approved)
**Change:** the roadmap's next step is INFRA / path to prod. The owner approved inserting two short
phases first, from a July audit re-checked on 2026-11-26. **Phase 1 (clean-up):** pin the Supabase CLI
to v2 in every workflow (`version: latest` now resolves to CLI v3, which drops `--project-ref` and
prompts on hosted changes, so `db-deploy` would break when armed); start the CI database with
`-x edge-runtime` to end the deno.land flake; make the `no-direct-prod-db` hook actually fire (its
`mcp__supabase__*` matcher never matched hosted connectors, and the refs it read were never set);
retarget the dependabot PRs to `integration/v2`; correct stale docs. **Phase 2 (security, dev only):**
migration `016` to stop anonymous calls to `get_all_user_settings_for_admin`, pin `search_path` on it
and `is_current_user_admin`, add five missing FK indexes, and make the `user_settings` policies
evaluate `auth.uid()` once; turn on leaked-password protection. **Why:** each is cheap, and several
would bite during or right after launch. **Cost:** about a day before INFRA starts. **Follow-ups:**
move CI to Supabase CLI v3 deliberately; consolidate the multiple permissive policies on
`sections`/`sites`; Playwright smoke tests after launch.

### 2026-07-12 — AI edit sessions: agentic tool loop + server-owned conversations (owner-directed)
**Change:** owner reported that every builder chat message was treated as a new conversation
(the function sent only the latest prompt: `messages: [{ role: "user", content: prompt }]`) and
approved the product-level fix rather than a patch. Shipped as Phase 1: (1) **agentic tool
loop** in `@hio/ai-engine` (`runToolLoop`) — the model calls tools, sees each result, and
continues until done (cap 5 iterations), replacing the single-shot one-tool-per-message flow;
multi-part requests now complete and failed tool calls become model-visible errors it can fix
and retry. (2) **Server-owned sessions** — migration `015_ai_sessions.sql` adds
`ai_sessions`/`ai_messages` (RLS, member-readable, written only by the function): the client
sends just a `session_id`, the authoritative API-shaped transcript (incl. tool_use/tool_result
blocks) lives server-side — un-forgeable, survives reloads, and doubles as the audit trail of
every AI action + per-tenant metering substrate. (3) **Snapshot-before-edit + Undo** — one
`"Before AI edit"` `snapshot_site` per applied request (user-scoped RPC), its version id rides
each edit to the UI, and the chat bubble grows an "↩ Undo this change" chip that calls
`restore_site_version`. The page state stays the model's primary context (system prompt rebuilt
fresh per request); the transcript adds intent continuity only. Phase 2 (deferred): streaming +
per-edit canvas refresh, tenant rate limits/metering surfaces. **Cost:** two new tables to
maintain; ai-command deploys carry the loop (still Haiku + prompt caching; history window
capped at 40 messages). Studio's builder client keeps the pre-session contract until PR #68
lands (backward compatible), then gets the same session/undo wiring.

### 2026-07-11 — Admin-side UX/UI overhaul (owner-directed, out-of-sequence)
**Change:** owner approved a full UX/UI overhaul of the admin side of both apps — dashboard,
admin console, page builder, settings, auth — before continuing INFRA/path-to-prod. Goals:
(1) an own design language for admin (persistent app shell, hand-rolled primitives on the
existing Tailwind `@theme` tokens — explicitly no shadcn/Radix), distinct from the public pages'
Warm Blueprint look; (2) the AI chat becomes the builder's PRIMARY editing path (persistent
two-pane layout, suggested actions, sessionStorage history) with manual editing demoted;
(3) desktop-first but nothing overflows at 375px. Public rendering (`.site-public` /
`.site-style-*`, `/[slug]`, `/sites/[slug]`, preview routes) and server-action security
(requireAdmin, RLS, Zod) are untouched; no migrations. Ships as **4 sequential PRs** (each
merged before the next branches — no stacking, after two squash-merge conflict incidents):
**PR 1** `packages/ui/src/admin/` primitives (`@hio/ui/admin` subpath: Button/Card/Field/Badge/
Spinner/Container/PageHeader/AdminShell/Toast/ConfirmDialog) + `--color-success` token +
self-serve `(app)` route group (shell; URLs unchanged) + auth/dashboard/landing restyle +
stale-metadata fix; **PR 2** AI-first builder — shared `builder/` components in `@hio/ui/admin`
(persistent chat pane, suggestion chips, history) replacing the four 100%-identical
per-app copies, server actions injected as props so the package stays Next-free; **PR 3**
self-serve admin console + settings on the design system (PR #64 behaviors preserved verbatim);
**PR 4** studio pages on the design system. **Cost:** INFRA work pushed back by the overhaul;
one new dependency-free token and a `"./admin"` package export to maintain.

### 2026-07-06 — Admin console improvements (owner-directed, out-of-sequence)
**Change:** owner asked for a small audit of Self-Serve's `/admin` console (access, reaction,
styling-picker usability) after using it; approved acting on the resulting plan. Shipped:
(1) `setLocked`/`setDisabled` server actions + Lock/Unlock/Disable/Enable buttons in `AdminTable`
— `is_locked`/`is_disabled` existed in the schema and were displayed as read-only badges since
M2.1 but had no admin-UI path to actually set them (SQL-only); a new `assertNotSelf` guard blocks
an admin from locking/disabling their own account (no recovery path through the console otherwise).
(2) Module-override checkboxes now autosave on toggle instead of requiring a separate "Save
overrides" button, matching the tier `<select>`'s existing autosave behavior — the two controls in
the same row used to behave inconsistently. (3) A confirmation prompt before downgrading a paid
user to free, since it silently walls off any paid-only modules already on their page. (4) The
`/admin` entry point on `/dashboard` promoted from an inline text link to a proper button. (5) A
live-updating `<iframe>` preview of the "Page style"/"Margin pattern" pickers in both apps'
theme-settings forms (`SettingsForm`/`ThemeForm`), backed by a new unauthenticated preview route per
app (`/settings/preview`, `/clients/preview`) that renders sample Hero+Contact content against the
query-string theme values — previously these two (the newest, most visually dramatic) options had
no live preview at all, unlike accent/font/radius which already previewed live in the builder.
**Why an iframe, not an inline mini-preview:** the Warm Blueprint scaffold's spacing uses
`vw`-relative `clamp()`s: rendering it at a shrunk scale inside the settings page's own layout would
throw off the margin/scaffold proportions relative to what a visitor actually sees, since `vw` is
relative to the real browser viewport, not a containing element. An iframe gets its own independent
viewport, so the preview renders at correct proportions regardless of its embedded size.
**Why required:** owner-directed, following directly from a requested audit; a real, scoped
functional gap (lock/disable) plus usability polish, not a schema or seam change.
**Cost / mitigation:** none to the INFRA path. No migration (both flags already existed since
migration `001`). Live-verified on dev: self-lockout guard confirmed client-side (disabled buttons
on the caller's own row); tier-downgrade confirm/cancel both confirmed via DB (cancel leaves the
row unchanged, confirming persists); overrides autosave confirmed (no "Save" button remains,
toggling one checkbox persists immediately); both apps' live preview iframes confirmed rendering
the current theme and updating instantly on a control change, before saving. **Explicitly not
verified live:** `setLocked`/`setDisabled` themselves — the auto-mode permission classifier
correctly blocked locking/disabling a real user's account (`primallift`) as an unrequested,
unilateral action on shared state, and a fresh throwaway signup couldn't be used either (the dev
project requires email confirmation, and there's no reachable inbox). Confidence instead rests on
the action being structurally identical to the already-proven `setTier` (same `requireAdmin` +
single-row `UPDATE` + RLS pattern) and on Postgres RLS being row-scoped, not column-scoped — if
`settings_update_admin` already permits an admin's `UPDATE` on tier for a row, the same policy
covers `is_locked`/`is_disabled` on that row too.

### 2026-07-05 — AI section add/remove/populate (owner-directed, out-of-sequence)
**Change:** scope addition the owner made after seeing the content-expansion plan: "the AI helper
should be able to edit the content for the user, including adding and removing sections on request and
populating them with all possible entries." Audit confirmed the gap: section CRUD existed only as
manual builder server actions; the engine's `SectionStore` had `updateContent` only and the system
prompt explicitly told the model module-adding was out of scope. Shipped as a legitimate new
engine-level capability (unlike simple field additions): two new BUILT-IN tools in `@hio/ai-engine`
0.2.0 — `add_section` (type enum drawn from the ACTIVE provider's module set; content merged over
`defaults`, collection-item ids generated, validated against the module's `contentSchema` before
persisting) and `remove_section` — plus **optional** `insertSection`/`deleteSection` on the
`SectionStore` port (stores that omit them make the tools report "not supported"; additive, existing
stores compile unchanged), both names appended to `RESERVED_TOOL_NAMES` (`@hio/content-model` v1.7.0).
A new `buildSchemaContext(provider)` puts every enabled module's content JSON Schema in the system
prompt so the model can populate ALL fields (including v1.6.0 optionals invisible in the page
context); the prompt now instructs realistic full-field sample content (picsum.photos placeholder
image URLs) on newly added sections. In `ai-command`, section inserts/deletes deliberately write
through the USER-scoped client (anon key + caller JWT), not service-role, so RLS enforces the same
membership + Self-Serve tier gate as the manual "+ Module" buttons. Vendor bundle regenerated and
redeployed to the dev project.
**Why required:** owner-directed (verbatim, added scope); closes the last asymmetry between the manual
and AI editing paths on the expanded content model.
**Cost / mitigation:** none to the INFRA path; no migration, no RLS change (reuses existing policies
by construction). `max_tokens` raised to 4096 so one tool call can carry a fully populated collection
section.

### 2026-07-05 — Per-module content expansion + page polish + margin patterns (owner-directed, out-of-sequence)
**Change:** follows directly from the Warm-Blueprint work (PRs #60/#61); the owner asked for (a) page-
level polish — breathing room at the top/bottom of the drawing (`--bp-page-pad`, plus the column's own
opening rule and corner overshoots so the scaffold visibly continues into the new space) and a subtle
geometric fill for the drafting margin, shipped as a **new curated theme dimension**
(`tenants.theme.marginPattern` — none/dot-grid/diagonal-hatch/pinstripe — mirroring how `theme.style`
was wired: `MARGIN_PATTERN_OPTIONS` in `@hio/ui`, a `site-margin-<value>` wrapper class, pickers in both
apps' theme forms, defensive parse; another additive JSONB key under existing RLS, no migration); and
(b) a **per-module content-model expansion** — every module reviewed on its own terms for what a small
business/freelancer actually needs (`@hio/content-model` v1.6.0, all fields optional/additive — see
CONTRACT.md's changelog for the full field list: hero banner image + supporting text, bio tagline +
quick-facts collection with new `add_fact`/`update_fact`/`remove_fact` tools, services grid
(columns/icon/image/link — must look intentional with or without icon/image, per the owner), contact
hours + booking CTA, per-section intros, testimonial ratings). Manual editability moved from
key-discovery to a shared registry (`@hio/ui`'s `MODULE_SCALAR_FIELDS` + extended
`COLLECTION_FIELD_REGISTRY`), since discovery could never surface an optional field an existing row
doesn't carry; a drift test pins registry keys to the Zod schemas.
**Why required:** owner-directed (verbatim brief: think per module — "text, image, links, containers …
the typical things a small business or freelance will need" — editable from the builder, fitting the
shared skeleton); not roadmap-sequenced but directly unblocks real content on the new visual system.
**Cost / mitigation:** none to the INFRA path. No DB migration (JSONB content/theme only, existing RLS).
The ai-command vendor bundle was regenerated; the bundler now also vendors `collections.ts` and rewrites
extensionless relative imports (the previous bundle's `from "./collections"` would have broken the next
Deno redeploy — latent since PR #55).

### 2026-07-05 — "Warm Blueprint Brutalism" visual direction (owner-directed, out-of-sequence)
**Change:** replaces the stone/slate/primary public-page look (the prior `2026-07-05` visual-
identity entry below) with a technical-drawing/blueprint aesthetic per a detailed owner brief:
a page-level hairline scaffold (containers borrow scaffold segments rather than owning their own
borders), a border grammar (solid = real content, dashed = metadata, diagonal hatch = section-void
separator), one depth technique (offset-outline — no blur anywhere), two typographic voices (serif
headings as the content voice, mono uppercase-tracked as the annotation voice), a sparse ghost grid
of corner-tick cells in the Hero, and ONE signature element per the owner's explicit instruction not
to combine them: the **instrument panel** — the Contact module renders as a single dark slate panel
per page (the machine's window), with mono spec-sheet label/value rows joined by dotted leader lines.
**Architecture (owner-requested, for future swappability):** introduces `SiteStyle` /
`tenants.theme.style` in `@hio/ui`'s `theme.ts` as a new, independent theme dimension (alongside the
existing accent/font/radius pickers) — a curated picker, defaulting to `warm-blueprint-brutalism`.
The old stone/slate/primary look is kept as the picker's second option, `stone-slate` — concrete
proof the dimension actually swaps, not a single hardcoded default renamed. **Implementation choice:**
zero prop-threading through `ModuleRenderer`/module components. Every module renderer gained a
`data-module="<type>"` attribute and a handful of always-rendered, class-gated annotation elements
(item-count chips, ghost cells, leader lines) that are `display: none` by default; the entire look
lives in `globals.css`, scoped under `.site-style-<id>` ancestor selectors. A future third style is
purely a new CSS block + a `STYLE_OPTIONS` entry — never an `@hio/ui` component change. Verified this
holds by toggling a live test site between both style values via SQL and confirming the DOM/CSS
swapped correctly with no component code involved.
**Why required:** owner-directed art-direction request with a fully specified brief, not sequenced in
the roadmap; supersedes the prior visual-identity styling (same scope: both products' PUBLISHED pages
only, builder/dashboard/admin chrome untouched) rather than adding new scope.
**Cost / mitigation:** none to the INFRA path. No schema/RLS/edge-function change — `theme.style` is
an additive JSONB key covered by the existing `tenants_update_member` RLS policy, same as
accent/font/radius. Radius flattened to 0–2px for this style only (`[class*="rounded-"]` override,
excluding `rounded-full` so circular avatars are unaffected) since the brief explicitly prohibits
"rounded-corner card soup" for this look.

**Addendum 2026-07-05 — grid-coherence rework (owner rejected the first pass):** reviewing the live
page, the owner found it "inconsistent, like a bunch of elements thrown away … every section
\[has a\] different width; these background grid cells are not connected with the content of the
modules." Root cause confirmed in code: the scaffold was a decorative `background-image`
(`repeating-linear-gradient` at 33%/66% of the wrapper) — wallpaper behind the content — while every
module renderer kept its pre-existing, mutually inconsistent max-width (`720px` for most, `576px`
Contact, `960px` Gallery, none for Hero), so the painted lines never coincided with any real edge;
the brief's own success test ("cover the content — the empty structure alone should read as one
coherent drawing") failed. Reworked (same PR-scoped CSS block, still zero component changes): the
background-image scaffold was deleted and the grid is now the layout itself — one shared content
column (`margin-inline: var(--bp-margin)` on every module `section`, overriding the per-module
Tailwind widths for this style only), vertical rules drawn as each section's real `border-inline`
(identical boxes stacked flush join into two continuous full-height lines), horizontal rules as the
sections' real `border-top`/`border-bottom` at real content boundaries, with short construction-line
ticks extending each rule past the verticals into the margin (pinned at `top: -1px` off the same
border — coincident by construction). The first pass's hero ghost cells, "+" registration marks, and
hatch seam bands were cut per the brief's own "if it has no job, delete it" (their markup remains,
hidden by default). `stone-slate` and all builder/dashboard/admin pages untouched.

### 2026-07-05 — Manual collection-item editing (owner-directed, out-of-sequence)
**Change:** after the visual-identity work landed, the owner tested the 9 module types and found
they still "all look the same" and asked where to add real content — the builder's "Edit" button
only ever exposed **string** top-level fields (`Object.entries(content).filter(([, v]) => typeof
v === "string")`, both apps, confirmed by audit), so services/gallery/testimonial/calendar/links
array content, plus `show_past`/`columns` scalars, were completely unreachable manually; the only
path was the AI chat sidebar. Shipped as 3 stacked PRs: **#55** shared building blocks
(`packages/content-model/src/collections.ts` — pure append/update/remove helpers mirroring
`ai-engine`'s `appendItem`/`updateItem`/`removeItem` op semantics exactly; `packages/ui/src/forms/
CollectionEditor.tsx` + `collectionFields.ts` — a generic form + a per-module field registry for
the 5 collection types); **#56** wires it into Self-Serve's `SectionEditor`/`BuilderCanvas`/
`actions.ts` (`updateContent` now validates via `contentSchema.safeParse` before writing); **#57**
the Studio equivalent, resolving each client's own schema via `resolveVariant(tenant.id,
tenant.schema_variant)` (the same pattern `addSection` already used). **Merged 2026-07-05:** #55
and #57 landed on `integration/v2`. #57's branch had been retargeted directly to `integration/v2`
and, once there, already contained the complete stack (shared pieces + both apps' wiring) — so
#56 (auto-closed when its base branch #55 was deleted on merge, then recreated as #58) was closed
as a duplicate rather than merged. No content was lost and no duplicate commit landed; verified by
confirming `CollectionEditor` is wired into both apps' `SectionEditor` files on `integration/v2`.
**Why required:** owner-directed, surfaced by hands-on testing of the prior visual-identity PR;
not sequenced in the roadmap, but a real, small (three PRs, no schema/RLS change) product gap.
**Cost / mitigation:** none to the INFRA path. A real bug was caught and fixed while live-
verifying: `CollectionEditor` initializes every field (including optional ones) to `""` for a new
draft row, but `z.string().url().optional()` rejects an empty string (`optional` only permits
`undefined`) — fixed by stripping empty-string values for non-required fields before validating,
in both apps' save paths.

### 2026-07-05 — Public-site visual identity: stone/slate/primary (owner-directed, out-of-sequence)
**Change:** new shared default look for both products' PUBLISHED pages (Self-Serve `/[slug]`,
Studio `/sites/[slug]`/custom-domain) — a stone/slate/primary palette, subtle grid texture, and
section dividers via one new `.site-public` class in `packages/ui/src/globals.css`, applied on
both apps' public-page wrapper. Also gave each of the 9 module renderers a content-appropriate
layout (calendar date-badge, price-list leader lines, mounted-print gallery frames, etc.)
instead of a generic heading+text shape — benefits both products' public render and both
builders' live preview. Builder/dashboard/admin pages in both apps are unchanged.
**Why required:** owner-directed art-direction request, not sequenced in the roadmap; small,
additive (one shared CSS class + per-module layout polish), doesn't block or reorder the INFRA
work.
**Cost / mitigation:** none to the INFRA path. No schema, RLS, or edge function touched.

### 2026-06-21 — M4 tenant model: unified `tenants`, big-bang, generalized fn, domains in scope
**Change (4 decisions, human-ratified):** (1) build TENANCY.md's **unified `tenants`** model rather than
the roadmap's M4 wording of Studio-specific `clients`/`client_sites`/`themes`; (2) **big-bang** — migrate
the shipped Self-Serve product onto the tenant model too (not Studio-only/additive); (3) **one
generalized** tenant-aware `ai-command` rather than a separate `studio-ai-command`; (4) **custom domains
in scope** for M4.
**Why required:** TENANCY.md is the more-considered canonical doc and "both products are tenants" is the
stated north star; the roadmap's `clients/client_sites` line was shorthand. The owner chose the cleanest
end state over the lowest-risk staging.
**Cost / mitigation:** big-bang touches the live, verified Self-Serve product. **Mitigation:** land it via
**expand → migrate → contract** (M4.1 is the expand step — purely additive + backfill, Self-Serve keeps
running on its existing columns/policies; the new section-write policy is scoped to `kind='studio_client'`
so the tier gate is untouched). Generalizing the one edge function defers until M4.5; the live function is
unchanged until then. Custom domains add infra work (M4.8).

### 2026-06-20 — M3's schema-driven engine pulled forward into M2.5a
**Change:** the original plan made the engine schema-driven in **M3**, after M2 shipped a ported
*hard-coded* edge function. We built the engine schema-driven directly in **M2.5a** instead.
**Why required:** M2.3 had already built the pluggable seam (`SchemaProvider`/`ModuleDefinition`/
`AiToolDescriptor`). Given that seam, the schema-driven engine was the *cheaper first build* — porting
the hard-coded function first would have meant writing throwaway code and rewriting it in M3. The
dependency the M2/M3 split assumed (a hard-coded engine existing first) never materialized.
**Cost / mitigation:** M3's explicit *"freeze `content-model` as the stable seam"* gate risked being
lost. **Mitigation:** M3 is retained as a discrete gate (see above) — generalization is done, but the
seam-freeze review still happens before M4.

### 2026-06-20 — M2 split into M2.1–M2.6 sub-steps
**Change:** the plan wrote M2 as one milestone; we ship it as numbered sub-PRs.
**Why required:** the plan's own rule is "each step = a reviewed PR," and the constitution requires
small, focused PRs. M2-as-written is too large for one reviewable PR. **Cost:** none — this is the
plan's principle applied more finely.

### 2026-06-19 — Self-Serve launches with 3 modules, not 9
**Change:** the plan said "port the 9 module renderers" in M2; we built hero/bio/links (3).
**Why required:** prioritize a working end-to-end vertical slice (add → edit → AI-edit → public
page) over breadth. **Cost:** the other 6 modules + drag-drop + shadcn restyle are deferred within
M2 (listed above), not dropped.

---

## Cost (low-budget, commercial)

No added platform cost: GitHub Free, **two** Netlify Free sites (commercial OK), one Supabase org
(dev + prod, free), Turborepo free. The only variable cost is Anthropic API usage in the edit
engine (Claude Haiku — cheap + prompt-cached).

## Verification gates (per milestone)

- **M1:** `turbo run build` builds both apps; each Netlify site serves its app; CI green.
- **M2:** sign up → auto-provision creates page + hero; add/edit/reorder modules; AI chat performs a
  tool-gated edit; public `/[slug]` renders; tier lock enforced by RLS.
- **M3:** unit tests prove tools are generated from a schema and bad input is rejected server-side;
  swapping the `SchemaProvider` changes available AI tools with no engine code change; the seam is
  reviewed and frozen.
- **M4:** create a client in Studio with a distinct theme/schema; AI edits that client's site via its
  provider; publish to a per-client domain; roll back via version history.
- **Throughout:** every PR flows through hooks → `review-pr` (migration-reviewer + security-reviewer)
  → CI → Netlify preview.
