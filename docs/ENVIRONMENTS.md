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

## Local development & testing

Both apps run from the monorepo against the **dev** Supabase project and share the same
auth, so one test user logs into both. Routes use the App Router under `apps/<app>/src/app/`.

| Product | Folder | Local URL | Auth | Key routes |
|---------|--------|-----------|------|------------|
| **Self-Serve** (self-register page builder) | `apps/self-serve` | http://localhost:3000 | public **sign-up** | `/signup` · `/login` · `/dashboard` · `/builder` · `/admin` · `/[slug]` (public page) |
| **Studio** (agency-managed client sites) | `apps/studio` | http://localhost:3001 | **login only** (staff gated by `is_admin`) | `/login` · `/dashboard` · `/clients/new` · `/clients/[id]` (settings) · `/clients/[id]/builder` · `/sites/[slug]` (public) · `/hosted` (custom-domain render) |

Start them via the preview launcher (`D:\claude\.claude\launch.json`: `hio-self-serve`,
`hio-studio`) or:
```bash
npm --prefix apps/self-serve run dev               # → :3000
npm --prefix apps/studio run dev -- --port 3001    # → :3001
```

**Dev test user** (dev DB only; `is_admin=true`, `tier=paid` — works for both apps): credentials
are kept out of git — see the team's secure note / password manager, not this file (rule #3).

**Testing custom domains (M4.8) locally** — routing is in Next middleware, no Netlify needed:
map a domain on a client's settings page, publish the site, then either
`curl -H "Host: theclient.com" http://localhost:3001/` (renders that client's site), or add
`127.0.0.1 theclient.com` to your OS hosts file and visit `http://theclient.com:3001/`.

## Netlify sites

Team **`culturenteam`** (`https://app.netlify.com/teams/culturenteam`), free tier. **One site per
app**, base dir = the app (config in `apps/<app>/netlify.toml`). The current M4 code lives on
**`integration/v2`**, so that is the deploy branch until v2 → `main`.

| Site | Netlify name / ID | Intended domain | `.netlify.app` URL | Deploy branch |
|------|-------------------|-----------------|--------------------|---------------|
| **Studio** | `hio-studio` · `a6bd66d8-302d-4044-96d4-defa8bef1134` | `studio.hio.space` | hio-studio.netlify.app | `integration/v2` |
| **Self-Serve** | `hio-self-serve` · `95a23890-3a2a-4cd7-a01a-7e451cfc703d` | `app.hio.space` | hio-self-serve.netlify.app | `integration/v2` |

> The pre-existing Netlify sites **`hio-builder`** (`build.hio.space`) and **`hio-space-poli`** are
> the **frozen explorations**, NOT this monorepo — leave them alone. `build.hio.space` stays on the
> old exploration by decision (2026-06-21).

**Public env vars already set** (via MCP, `all` context — point at the dev project):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key) on both;
`NEXT_PUBLIC_STUDIO_APP_HOSTS=studio.hio.space` on Studio; `NEXT_PUBLIC_SITE_URL=https://app.hio.space`
on Self-Serve.

**Remaining manual steps (dashboard / OAuth — cannot be done from here):**
1. **Link the repo** — on each site, Site configuration → Build & deploy → link `culturenteam/hio-main`
   (authorize the Netlify GitHub App for the private repo). Set **base directory** `apps/studio` /
   `apps/self-serve` (or let `netlify.toml` drive it) and **production branch = `integration/v2`**.
2. **Self-Serve secret** — add `SUPABASE_SERVICE_ROLE_KEY` (server-only, **not** `NEXT_PUBLIC_`) from
   the dev Supabase project's API settings. Studio needs no service-role key.
3. **Domains** — Studio: add `studio.hio.space` as the primary domain + each test client domain (e.g.
   `acme.hio.space`) as a **domain alias** (that is what M4.8 resolves). Self-Serve: add `app.hio.space`.
   Point DNS at Netlify so certs issue.
4. Trigger the first deploy (push / "Deploy site").

## What's connected today
- ✅ **dev** Supabase wired (this account, `Hio` project) — `.env.local` set for both apps.
- 🔵 **Netlify** — both monorepo sites **created + public env set** (above); repo-link, service-role
  secret, and domains are the outstanding manual steps. Old exploration sites untouched.
- ⬜ **prod** Supabase — create the project in the separate account, then fill `SUPABASE_PROD_REF`, the
  Netlify production env, and the GitHub secrets above. (Cannot be done from the dev account.)
