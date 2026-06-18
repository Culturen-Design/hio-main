---
name: open-pr
description: Branch, commit, and open a pull request the team's way — runs the full local gate first, uses conventional commits, fills the PR template, adds labels. Use when changes are ready to share for review.
---

# open-pr

Never push straight to `main`. Open a PR so CI + a human review every change.

## Steps
1. Ensure you're on a feature branch, not `main`:
   `git switch -c <type>/<short-desc>` (types: feat, fix, chore, refactor, docs, test).
2. Run the full gate locally and fix anything red: `npm run check`.
   If the change touched the DB, also run `npm run db:lint`.
3. Stage and commit with a conventional-commit message:
   `git add -A && git commit -m "feat: <imperative summary>"`.
4. Push: `git push origin HEAD`.
5. Open the PR with the template and a clear body:
   `gh pr create --fill --label needs-review`
   - Title: conventional-commit style.
   - Body must follow `.github/pull_request_template.md` (what/why, testing, DB changes, screenshots for UI).
6. After CI runs, confirm checks are green and the **Netlify Deploy Preview** URL is posted
   on the PR. Drop the preview URL in the PR description for reviewers.

## Do not
- Do not merge your own PR without a human approval.
- Do not force-push shared branches.
- Do not include `.env*` or secrets in the diff (the block-secrets hook guards this).
