# hio — monorepo

This repository is **hio**: two products sharing one schema-driven AI editing engine, built on the
AI-assisted dev workflow starter documented below.

- **hio Self-Serve** — a self-register personal page builder (free + paid tiers unlock modules).
- **hio Studio** — agency-managed custom client sites, each a theme + content-schema variant.
- **One engine** — `@hio/ai-engine` builds its Claude tools from a `SchemaProvider`
  (`@hio/content-model`, frozen at v1.0.0). Self-Serve ships one built-in provider; Studio resolves
  one **per client**. Same engine, two products.

**Start here:** [`docs/ROADMAP.md`](docs/ROADMAP.md) is authoritative for *what* we build and *in what
order* (currently **M4 — Studio**). See also [`docs/TENANCY.md`](docs/TENANCY.md) (the unified tenant
model), [`docs/ENVIRONMENTS.md`](docs/ENVIRONMENTS.md) (dev/prod), and
[`packages/content-model/CONTRACT.md`](packages/content-model/CONTRACT.md) (the frozen seam).

Layout: `apps/{self-serve,studio}` + `packages/{ai-engine,content-model,ui,db}` + `supabase/`
(shared migrations + edge functions). Engineering rules: [`CLAUDE.md`](CLAUDE.md).

> **Note:** this repo has **no local Supabase CLI**. Migrations are authored by hand
> (`supabase/migrations/NNN_name.sql`) and applied to **dev** via the Supabase MCP; CI runs the CLI
> path. The starter documentation below describes the general toolkit (the CLI-first flow is the
> canonical design and what CI uses).

---

# Next.js + Supabase + Netlify — AI-Assisted Dev Workflow Starter

A reusable starter for **small teams (2–5)** building Next.js + Postgres apps with
Claude Code, on a **low budget**. The philosophy:

> **Deterministic guardrails (hooks + CI) enforce. The AI authors. Humans review PRs.**

Anything that *must* be true is encoded as a hook or a CI gate — never left to the model's
good intentions.

---

## What's in the box

| Layer | Files | Purpose |
|-------|-------|---------|
| **Constitution** | `CLAUDE.md` | Short, enforced rules Claude follows in this repo |
| **Permissions** | `.claude/settings.json` | Pre-approved safe commands + hard-denied dangerous ones |
| **Guardrail hooks** | `.claude/hooks/*.mjs` | Block secrets, protect migrations/infra, block prod-DB writes, auto format+typecheck |
| **Skills** | `.claude/skills/*` | `new-feature`, `db-migration`, `open-pr`, `review-pr` |
| **Subagents** | `.claude/agents/*` | `migration-reviewer`, `security-reviewer` (isolated review contexts) |
| **Commands** | `.claude/commands/*` | `/ship`, `/promote` |
| **Scoped MCP** | `.mcp.json` | Only Supabase (read-only, dev ref) + Netlify |
| **CI/CD** | `.github/workflows/*` | Quality gate, prod migrations, preview cleanup |
| **Plugin** | `plugin/`, `scripts/build-plugin.mjs` | Package all of the above to share across projects |

---

## Environments (3 tiers)

| Tier | Branch | Netlify context | Supabase | Purpose |
|------|--------|-----------------|----------|---------|
| Local | feature branch | `netlify dev` | local stack (`supabase start`) | author + test |
| Dev / Preview | every PR | Deploy Preview | `dev` project (or per-PR branch on Pro) | review + QA |
| Prod | `main` | Production | `prod` project | live |

Trunk-based flow: short-lived feature branch → PR → green CI + human approval → **squash-merge**
to `main` → auto-deploy to prod + prod migration.

---

## Cost (commercial, low budget)

**Start at ~$0/mo:**
- GitHub Free · Netlify Free (commercial OK, 300 build-min/mo, Deploy Previews) · Supabase Free
  (2 projects: `dev` + `prod`)
- Per-PR DB isolation via the **local Supabase CLI** (no paid branching)

**Scale to ~$25–45/mo when it hurts:**
- Supabase Pro ($25/mo) → per-PR DB branching, daily backups, no auto-pause
  - ⚠️ A left-running preview branch bills ~$9.60/mo. The `preview-cleanup.yml` workflow deletes
    them on PR close — enable it when you turn branching on (set repo variable
    `SUPABASE_BRANCHING_ENABLED=true`).
- Netlify Pro only when build minutes/seats force it.

> Vercel was deliberately avoided: its free Hobby tier forbids commercial use.

---

## One-time setup

1. **Create the repo & install**
   ```bash
   npm install
   npx create-next-app   # OR keep this scaffold; this repo already has the App Router skeleton
   ```
2. **Supabase**: create two projects (`dev`, `prod`). Then:
   ```bash
   cp .env.example .env.local        # fill in dev URL + anon key + refs
   supabase link --project-ref <dev-ref>
   npm run db:start && npm run db:reset
   ```
3. **Netlify**: connect the GitHub repo. Install the **Supabase integration** so env vars are
   injected per deploy context (prod → prod project; deploy-preview → dev/branch).
4. **GitHub secrets** (Settings → Secrets → Actions) — used only by CI, never by Claude:
   `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROD_REF`, `SUPABASE_PROD_DB_PASSWORD`.
5. **Branch protection on `main`** (Settings → Branches): require PR, require status checks
   (`quality`, `migrations`), require 1 approval, no force-push, linear history (squash).
6. **Claude Code MCP tokens** (your shell env): `SUPABASE_ACCESS_TOKEN`, `NETLIFY_AUTH_TOKEN`,
   `SUPABASE_DEV_REF`, `SUPABASE_PROD_REF` so `.mcp.json` and the prod-guard hook resolve.

---

## The daily loop

```
claude  →  /ship "add saved searches"
```
1. Creates a feature branch.
2. `new-feature` skill scaffolds route + test; `db-migration` skill handles any schema change (CLI-first).
3. `format-and-check` hook keeps every edit formatted + type-clean (blocks on errors, feeds them back).
4. `review-pr` skill self-reviews; `migration-reviewer` + `security-reviewer` subagents audit.
5. `open-pr` skill runs `npm run check`, pushes, opens a PR with the template.
6. CI runs the quality gate; Netlify posts a **Deploy Preview** URL on the PR.
7. A human reviews the preview + diff and approves. `/promote` runs the pre-merge checklist.
8. Squash-merge → prod deploy + `db-deploy` applies migrations to prod. Preview branch auto-cleaned.

---

## The guardrails (what's hard-coded)

- **`block-secrets`** — denies reading/editing `.env*` (except `.env.example`), dumping the env,
  or git-adding secrets.
- **`protect-paths`** — applied migrations are immutable; infra files (`netlify.toml`,
  `.github/workflows`, `.claude/settings.json`, `.mcp.json`) need `CLAUDE_ALLOW_INFRA=1`.
- **`no-direct-prod-db`** — blocks any Supabase MCP call referencing the prod ref or any write op
  not explicitly targeting dev. (The MCP server also runs `--read-only`.)
- **`format-and-check`** — Biome + `tsc --noEmit` after every edit; blocks until clean.
- **CI** — lint + typecheck + test + build + migration-immutability check; required to merge.
- **`db-deploy`** — the *only* path that writes prod schema, using CI-only secrets.

---

## Share across projects (plugin)

The whole `.claude/` toolkit is packaged as a Claude Code **plugin** so new projects inherit it
without copy-paste:

```bash
npm run plugin:build         # builds plugin/ai-dev-workflow from .claude/
# commit, then in another project:
/plugin marketplace add <this-repo-url>
/plugin install ai-dev-workflow
```

`.claude/` is the source of truth; re-run `plugin:build` after changing hooks/skills/agents/commands.

---

## Swappable defaults

Chosen for AI-friendliness + low cost, isolated to single config points so you can replace them:
**Drizzle/SQL** (migrations are plain SQL here), **Zod** (`src/lib/env.ts`), **Vitest**
(`vitest.config.ts`), **Playwright** (e2e), **Biome** (`biome.json`). Swap any without touching
the workflow.
