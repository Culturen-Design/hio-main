---
name: review-pr
description: Structured self-review of the current diff before requesting human review. Runs the reviewer subagents (migration + security) and a quality checklist. Use right before open-pr, or when asked to review changes.
---

# review-pr

Catch problems before a human spends time. Review only the diff, not the whole repo.

## Steps
1. Get the diff: `git diff main...HEAD` (or staged diff if pre-commit).
2. **Quality checklist** — verify each:
   - [ ] `npm run check` passes (lint + typecheck + test).
   - [ ] Every new external input is Zod-validated.
   - [ ] No server secret / service-role key is imported into a client component.
   - [ ] New user-facing logic has a test.
   - [ ] No dead code, no stray `console.log`, no committed `.env*`.
   - [ ] Reuses existing helpers (`src/lib/supabase/*`, `src/lib/env.ts`) instead of duplicating.
3. **If the diff touches `supabase/migrations/`** → invoke the **migration-reviewer** subagent
   on the new migration file and address its findings.
4. **Always** invoke the **security-reviewer** subagent on the diff (RLS, auth, secrets).
5. Summarize findings as: Blockers / Should-fix / Nits. Fix Blockers and Should-fix before
   handing off to **open-pr**.

## Output
A short report the human reviewer can trust, plus a clean diff with issues resolved.
