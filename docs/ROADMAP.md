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

- **Now:** mid-**M2 (Self-Serve port)**. **M2.5a** (AI engine + edge function + ChatSidebar) ✅
  merged (#6). **M2.5b** (tiers/admin) ✅ done, in PR (#8).
- **Next action:** **M2.6 — deploy + live verify**: deploy the `ai-command` edge function to dev
  (`supabase functions deploy` + set `ANTHROPIC_API_KEY` secret) and verify ChatSidebar end-to-end.
- **Then:** the **M3 seam-freeze gate** (ratify `content-model` as stable) before M4.
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

### M2 — Self-Serve port (builder → guarded Next) 🔵
Bring the builder's schema/RLS/auth/modules/AI editor onto the guarded Next.js stack.

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
- **M2.5b — Tiers + admin** ✅ *(in PR, #8)* admin-gated `/admin` console: per-user tier `free↔paid`
  + `module_overrides` grants, via Zod-validated server actions enforced by the existing
  `settings_update_admin` RLS policy. No migration — the `is_admin` flag + admin RLS already existed
  (migrations `001`/`004`). Dashboard shows an Admin link to admins. Verified live (non-admin gate,
  admin view, write path).
- **M2.6 — Deploy + live verify** ⬜ **(next)** deploy `ai-command` to dev, set `ANTHROPIC_API_KEY`
  secret, verify ChatSidebar end-to-end.

**Module build-out (widening M2, in parallel while M2.6 is owner-blocked):** `calendar` ✅ done
(renderer + `add_event`/`update_event`/`remove_event` AI tools — first module to exercise the
engine's `updateItem` op; paid-tier gated). Remaining renderers: `services`, `contact`, `gallery`,
`testimonial`, `custom`. Plus drag-and-drop reordering and the shadcn/design-system restyle of all
renderers.

### M3 — Extract, generalize & **freeze** the core ↪ (largely pulled into M2.5a)
The engine is already schema-driven with Vitest coverage (done in M2.5a). **What remains and must
not be skipped:** ratify and **freeze `content-model` as the stable seam** — a deliberate review
that the `SchemaProvider`/`AiToolDescriptor` contract is good enough for Studio to build on without
churning it. This is the control point the M3→M2.5 pull-forward put at risk; we keep it as an
explicit gate before M4.

### M4 — Studio (build on the proven core) ⬜
New `apps/studio`: agency dashboard + **tenant model** (new migrations: `clients`, `client_sites`,
`themes`, per-client schema variant). Resolve a `SchemaProvider` per client; reuse `ai-engine`
unchanged. Per-client publishing + custom domains. Add **version history** (rollback). See
[`TENANCY.md`](TENANCY.md).

---

## Deviation log

Every approved departure from the original plan, with its reason and cost.

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
