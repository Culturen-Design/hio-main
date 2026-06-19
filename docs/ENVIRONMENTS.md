# ENVIRONMENTS.md — Supabase, accounts, and env vars

How dev and prod map to Supabase, and which secret goes where. See `TENANCY.md` for how
clients/users are isolated *within* an environment.

## The mapping

| Env | Supabase account | Project | Used by |
|-----|------------------|---------|---------|
| **dev** | current account (`culturen design`) | **Hio** — ref `yfvqmzaqhayveqllchuh` | local dev + Netlify Deploy Previews |
| **prod** | **separate account** (isolated credentials) | created in that account — ref `TBD` | Netlify production + CI `db-deploy` |

Prod lives in a **different Supabase account** on purpose: a leaked dev token can't touch prod,
and only prod-account holders can administer it. The two are linked only by the env vars/secrets
below — nothing in code.

## Where each value goes

**Local dev** — `apps/<app>/.env.local` (gitignored), pointing at the **dev** project:
```
NEXT_PUBLIC_SUPABASE_URL=https://yfvqmzaqhayveqllchuh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...        # publishable key (safe in the browser)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_DEV_REF=yfvqmzaqhayveqllchuh
SUPABASE_PROD_REF=<prod-ref>                            # used by the no-direct-prod-db hook
```

**Netlify** (per site, per context — set in the Netlify UI / Supabase integration, never committed):
- *Deploy Preview / branch* context → **dev** project URL + anon key.
- *Production* context → **prod** project URL + anon key (from the prod account).

**GitHub Actions secrets** (Settings → Secrets → Actions) — for `db-deploy.yml` (prod only):
- `SUPABASE_ACCESS_TOKEN` → a token from the **prod account**
- `SUPABASE_PROD_REF` → the prod project ref
- `SUPABASE_PROD_DB_PASSWORD` → prod DB password
- Then set repo **variable** `PROD_DB_DEPLOY_ENABLED=true` to arm the deploy.

## Schema flow (one source of truth)
`supabase/migrations/` is authored against **local** (`supabase start`) and **dev**, then applied
to **prod** only by CI on merge to `main`. Never hand-edit prod schema. Every tenant in an
environment shares that environment's single database (see `TENANCY.md`).

## What's connected today
- ✅ **dev** wired (this account, `Hio` project) — `.env.local` set for both apps.
- ⬜ **prod** — create the project in the separate account, then fill `SUPABASE_PROD_REF`, the
  Netlify production env, and the GitHub secrets above. (Cannot be done from the dev account.)
