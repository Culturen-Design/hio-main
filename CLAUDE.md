# CLAUDE.md — Project Constitution

This file is the contract Claude Code follows in this repo. Keep it short. Long
procedures live in `.claude/skills/` and load on demand.

## Stack
- **Monorepo** — npm workspaces + Turborepo. `apps/{self-serve,studio}` + `packages/{ai-engine,content-model,ui,db}`.
- **Next.js** (App Router, TypeScript, React 19) — app code in `apps/<app>/src/`
- **Supabase** (Postgres + Auth + Storage) — shared schema in `supabase/migrations/`
- **Netlify** hosting — one site per app (`apps/<app>/netlify.toml`, base dir = the app)
- **Biome** lint+format · **Vitest** unit · **Playwright** e2e · **Zod** validation
- Package manager: **npm**. Run tasks via Turbo: `npm run check` = `turbo run lint typecheck test`.

## Two products, one engine
hio is two business lines sharing one **schema-driven AI editor** (`packages/ai-engine`): it builds its
Claude tools from a `SchemaProvider` (`packages/content-model`). **Self-Serve** ships one built-in schema;
**Studio** resolves a schema + theme per client. Never hard-code module types in the engine — extend the
provider. See `docs/EXPLORATION-COMPARISON.md` and the **roadmap** (`docs/ROADMAP.md`).

## Non-negotiable rules (enforced by hooks + CI — do not work around them)
1. **Never touch production data.** No writes to the prod Supabase project. All DB
   changes are SQL migrations in `supabase/migrations/`, applied to prod only by CI on merge.
2. **Migrations are append-only and immutable.** Never edit an applied migration —
   create a new one with `supabase migration new`. Every user-data table has RLS enabled.
3. **Secrets never enter code or context.** Don't read, print, or commit `.env*` or any
   key. Public values use the `NEXT_PUBLIC_` prefix; everything else is server-only.
4. **Server secrets never reach the client.** Never import `serverEnv()` or the service-role
   key into a Client Component. Validate all external input with Zod.
5. **`main` is always shippable.** All work happens on a branch → PR → green CI → human review.
6. **Follow the roadmap; never deviate silently.** `docs/ROADMAP.md` is authoritative for *what*
   to build and *in what order*. Work the next step in sequence. If a different order, scope, or
   step is warranted, **stop and propose the change explicitly — what changes and why it's required —
   and get a human decision before acting.** Every approved deviation gets a dated entry in the
   roadmap's Deviation log. A deviation without a logged reason is a defect.

## How to do common things (use these skills/commands)
- Add a feature → use the **`new-feature`** skill
- Change the database → use the **`db-migration`** skill (CLI-first)
- Open a pull request → use the **`open-pr`** skill (runs `npm run check` first)
- Review before handoff → use the **`review-pr`** skill (calls the reviewer subagents)
- Full cycle in one go → `/ship "<description>"` · Promote dev→prod → `/promote`

## What "good" looks like
- Every feature ships with a colocated test. `npm run check` (lint + typecheck + test) passes locally.
- Files follow existing structure: routes in `apps/<app>/src/app/`, shared cross-app code in `packages/*`.
- Prefer reusing existing utilities (`apps/<app>/src/lib/supabase/*`, `@hio/ui`, `@hio/content-model`) over new ones.
- Cross-app/shared logic belongs in a `packages/*` workspace, not copied between apps.
- Small, focused PRs with conventional-commit titles (`feat:`, `fix:`, `chore:`…).
