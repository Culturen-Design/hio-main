# CLAUDE.md — Project Constitution

This file is the contract Claude Code follows in this repo. Keep it short. Long
procedures live in `.claude/skills/` and load on demand.

## Stack
- **Next.js** (App Router, TypeScript, React 19) — code in `src/`
- **Supabase** (Postgres + Auth + Storage) — schema in `supabase/migrations/`
- **Netlify** hosting — config in `netlify.toml` (production / deploy-preview / branch contexts)
- **Biome** lint+format · **Vitest** unit · **Playwright** e2e · **Zod** validation
- Package manager: **npm**

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

## How to do common things (use these skills/commands)
- Add a feature → use the **`new-feature`** skill
- Change the database → use the **`db-migration`** skill (CLI-first)
- Open a pull request → use the **`open-pr`** skill (runs `npm run check` first)
- Review before handoff → use the **`review-pr`** skill (calls the reviewer subagents)
- Full cycle in one go → `/ship "<description>"` · Promote dev→prod → `/promote`

## What "good" looks like
- Every feature ships with a colocated test. `npm run check` (lint + typecheck + test) passes locally.
- Files follow existing structure: routes in `src/app/`, shared code in `src/lib/`, UI in `src/components/`.
- Prefer reusing existing utilities (`src/lib/supabase/*`, `src/lib/env.ts`) over new ones.
- Small, focused PRs with conventional-commit titles (`feat:`, `fix:`, `chore:`…).
