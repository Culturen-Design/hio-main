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

- **Now:** **M4 (Studio) feature-complete; entering the CONTRACT phase.** M2 + M3 are complete and the
  `ai-command` v5 bundle is deployed + live-verified on dev. M4 builds the unified tenant model and the
  Studio app on the frozen engine; **all M4 features (M4.1–M4.8) are done** — Studio has the full
  create → build → AI-edit → publish → public-render → version/rollback → custom-domain loop on the shared
  engine. **M4.1 (tenancy schema, expand phase) done** — unified `tenants`/`tenant_members`/`sites`
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
- **Next action:** **CONTRACT phase** — migrate Self-Serve off `pages`/`page_id` onto the unified
  `sites`/`sections` model (the MIGRATE step), then drop `pages` + the legacy page-based section policies +
  `page_id` and make `sections.tenant_id/site_id` NOT NULL (the CONTRACT step). **All M4 features
  (M4.1–M4.8) are done** — see below. The contract cannot start until Self-Serve no longer reads/writes
  `pages`/`page_id`.
- **In parallel (widening M2):** remaining renderers (`services`, `contact`, `gallery`,
  `testimonial`, `custom`), drag-and-drop reorder, shadcn restyle.
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
engine's `updateItem` op; paid-tier gated). Remaining renderers: `services`, `contact`, `gallery`,
`testimonial`, `custom`. Plus drag-and-drop reordering and the shadcn/design-system restyle of all
renderers.

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
    `[slug]` renders all modules via `sites`; unknown slug → 404). **Remaining pages reference:**
    `admin/page.tsx` still reads `pages.slug` to label users — needs an admin-readable user→slug path
    (small change) before CONTRACT drops `pages`.
  - **PR C — ai-command** 🔵 (code complete; dev redeploy pending) generalize the `{tenant_id, site_id}`
    branch to accept any tenant the caller is a member of — the only change is dropping the
    `kind='studio_client'` filter, so a `self_serve` tenant resolves via `resolveVariant('self-serve')`
    (≡ `selfServeSchema`). Self-Serve ChatSidebar now sends `{tenant_id, site_id}`; the builder no longer
    looks up `pages` at all. No `@hio/*` change → vendor bundle unchanged. **Verified at SQL/logic level**
    (the test user's self_serve tenant passes every check the generalized fn performs: member, variant
    `self-serve`, site-belongs, sections-by-site). **Remaining: redeploy ai-command to dev as v6** (MCP
    `deploy_edge_function`, inline incl. vendor/*) + live AI smoke-test of the self_serve `{tenant_id,
    site_id}` path. Held deliberately because a bad inline-vendor transcription would replace the live dev
    function (used by Studio too) — do it carefully / when not mid-manual-testing.
- **CONTRACT phase (late M4):** make `sections.tenant_id/site_id` NOT NULL and drop `pages` + the
  legacy page-based section policies + `page_id`, once the MIGRATE phase above lands (Self-Serve no
  longer reads/writes `pages`/`page_id`).

---

## Deviation log

Every approved departure from the original plan, with its reason and cost.

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
