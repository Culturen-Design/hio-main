---
description: Full dev cycle for one change — branch, implement with tests, self-review, open a PR with a preview.
argument-hint: "<what to build>"
---

Run the complete feature cycle for: **$ARGUMENTS**

Follow this order, stopping to ask the user only if requirements are genuinely ambiguous:

1. **Branch** — create a feature branch: `git switch -c feat/<short-slug>`.
2. **Plan briefly** — restate the change in 1–2 sentences and whether it needs a DB change.
3. **Database (if needed)** — use the **db-migration** skill end-to-end before touching UI.
4. **Implement** — use the **new-feature** skill. Reuse existing helpers. Add a colocated test.
   The `format-and-check` hook will keep edits formatted + type-clean as you go.
5. **Self-review** — use the **review-pr** skill (runs migration-reviewer + security-reviewer).
   Fix all Blockers and Should-fix items.
6. **Open PR** — use the **open-pr** skill. Ensure `npm run check` is green first.
7. **Report back** — give the user: the PR URL, the Netlify Deploy Preview URL, a summary of
   changes, and anything that needs human attention before merge.

Never merge to `main` yourself — a human approves and merges.
