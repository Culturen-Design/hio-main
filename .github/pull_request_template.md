<!-- Conventional-commit title, e.g. "feat: add saved searches" -->

## What & why
<!-- What does this change do, and why? Link any issue. -->

## How to test
<!-- Steps a reviewer follows on the Netlify Deploy Preview. -->
- Preview URL:

## Database changes
<!-- Migrations in this PR? If yes, list them and confirm they are additive /
     backward-compatible with the currently-deployed app. If none, write "none". -->
- [ ] No migrations, OR
- [ ] Migrations included and reviewed by `migration-reviewer` (additive / safe)

## Checklist
- [ ] `npm run check` passes locally (lint + typecheck + test)
- [ ] New external input is Zod-validated
- [ ] No server secret reaches the client; no `.env*` committed
- [ ] Tests added/updated for the change
- [ ] New env vars (if any) added to Netlify prod context + GitHub secrets

## Screenshots / notes
<!-- UI changes: before/after. Anything reviewers should know. -->
