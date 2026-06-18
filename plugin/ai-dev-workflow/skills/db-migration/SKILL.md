---
name: db-migration
description: Author and apply a Supabase database change safely, CLI-first. Use whenever a task needs a schema change — new table/column, index, RLS policy, function, or trigger. Never edit production directly.
---

# db-migration

All schema changes are versioned SQL migrations. Production is changed ONLY by CI on
merge to `main`. The `no-direct-prod-db` hook will block MCP writes to prod, and
`protect-paths` makes applied migrations immutable.

## Steps
1. Start the local stack if not running: `npm run db:start`.
2. Create a new migration file:
   `npm run db:new -- <short_snake_case_name>`  →  creates `supabase/migrations/<ts>_<name>.sql`.
3. Write the SQL in that new file. Requirements:
   - Use `if not exists` / `if exists` for idempotency where sensible.
   - **Every table holding user data must `enable row level security`** and have explicit policies.
   - Prefer additive changes. For destructive/altering changes, include a safe path
     (backfill, nullable-then-not-null in steps) — the **migration-reviewer** subagent will check this.
   - Keep `updated_at` triggers consistent with the pattern in `0000_init.sql`.
4. Apply locally and verify: `npm run db:reset` (re-runs all migrations + seed), then
   inspect via `supabase status` / Studio. Confirm `npm run db:diff` shows no unexpected drift.
5. Lint the schema: `npm run db:lint`.
6. Regenerate types: `npm run db:types` (updates `src/lib/supabase/database.types.ts`).
7. Have the **migration-reviewer** subagent audit the new migration before opening the PR.

## Hard rules
- NEVER edit an already-committed/applied migration — create a new one.
- NEVER run `supabase db push` against prod yourself — CI does that on merge.
- NEVER use the service-role key locally for app code.
