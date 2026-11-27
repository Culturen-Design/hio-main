---
name: db-migration
description: Author and apply a Supabase database change safely. Use whenever a task needs a schema change — new table/column, index, RLS policy, function, or trigger. Never edit production directly.
---

# db-migration

All schema changes are versioned SQL migrations in `supabase/migrations/`, named
sequentially `NNN_short_snake_case.sql` (e.g. `007_tenancy_expand.sql`). Production is
changed ONLY by CI on merge to `main`. The `no-direct-prod-db` hook blocks MCP writes to
prod, and `protect-paths` makes applied migrations immutable.

> **This repo has no local Supabase CLI installed.** Author the migration file by hand and
> apply it to **dev** through the **Supabase MCP** (`apply_migration`). The CLI commands below
> (`db:start`/`db:reset`/`db:lint`/`db:types`) are the canonical path *when a CLI is available*
> and are what CI runs (`supabase start` + `db lint` in `.github/workflows/ci.yml`); locally,
> use the MCP equivalents in step 4–6.

## Steps
1. Create the next migration file by hand: `supabase/migrations/<NNN+1>_<short_snake_case>.sql`.
2. Write the SQL. Requirements:
   - Use `if not exists` / `if exists` for idempotency where sensible.
   - **Every table holding user data must `enable row level security`** and have explicit policies.
   - Prefer additive changes. For destructive/altering changes, include a safe path
     (backfill, nullable-then-not-null in steps). For a big rewrite, stage it
     **expand → migrate → contract** (see migration `007` for the pattern).
   - Keep `updated_at` triggers consistent with the pattern in `001_initial_schema.sql`.
   - `CREATE OR REPLACE FUNCTION` resets unspecified attributes — re-`SET search_path = public, pg_temp`
     on any `SECURITY DEFINER` function you replace.
3. Apply to **dev**: Supabase MCP `apply_migration` (name = the migration's snake_case name).
   *(CLI alternative: `npm run db:reset`.)*
4. Verify with MCP `execute_sql` (e.g. confirm a backfill left 0 orphan rows) before moving on.
5. Lint: MCP `get_advisors` (type `security` and `performance`) — triage which findings are NEW
   vs pre-existing. *(CLI alternative: `npm run db:lint`.)*
6. Regenerate types: MCP `generate_typescript_types`, write the result to
   **`packages/db/src/database.types.ts`**. Then `tsc --noEmit` the affected packages/apps.
   *(CLI alternative: `npm run db:types`.)*
7. Have the **migration-reviewer** subagent audit the new migration before opening the PR
   (the `review-pr` skill runs it).

## Hard rules
- NEVER edit an already-committed/applied migration — create a new one.
- NEVER run `supabase db push` against prod yourself — CI does that on merge.
- NEVER apply a migration to the **prod** project via the MCP — the `no-direct-prod-db` hook blocks it.
- NEVER use the service-role key locally for app code.
