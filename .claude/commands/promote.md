---
description: Pre-merge promotion checklist for taking a reviewed PR from preview to production.
argument-hint: "[PR number]"
---

Run the production-promotion checklist for PR **$ARGUMENTS** (or the current branch's PR).

Production deploys happen automatically on merge to `main`; this command makes sure merging is safe.

1. **CI green** — confirm all required checks pass: `gh pr checks $ARGUMENTS`.
2. **Approved** — confirm at least one human approval exists: `gh pr view $ARGUMENTS`.
3. **Preview verified** — confirm the Netlify Deploy Preview URL works and the change behaves
   as intended (note what you verified).
4. **Migrations safe** — if the PR includes migrations, confirm the **migration-reviewer** signed
   off and that they are additive/backward-compatible with the currently-deployed app
   (prod runs the old code until the new deploy finishes).
5. **Env vars** — confirm any new env vars are set in Netlify's **production** context and in
   GitHub Actions secrets (for `db-deploy`) — list any that are missing. Do NOT print their values.
6. **Summary** — report: ready-to-merge yes/no, with a short rationale and any remaining risks.

Do NOT merge automatically. Present the checklist result and let the human merge (squash).
On merge to `main`: Netlify deploys prod and `db-deploy.yml` applies migrations to the prod DB.
