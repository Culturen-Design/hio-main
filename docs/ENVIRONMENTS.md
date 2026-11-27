# ENVIRONMENTS.md — Supabase, accounts, and env vars

How dev and prod map to Supabase, and which secret goes where. See `TENANCY.md` for how
clients/users are isolated *within* an environment.

## The mapping

| Env | Supabase account | Project | Used by |
|-----|------------------|---------|---------|
| **dev** | current account (`culturen design`) | **Hio** — ref `yfvqmzaqhayveqllchuh` | local dev + Netlify Deploy Previews |
| **prod** | **separate account** (isolated credentials) | **hio-prod** — ref `ltrigisoniqcsuamaebj` (created 2026-06-22, separate org — invisible to the dev account's token, confirmed) | Netlify production + CI `db-deploy` |

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
SUPABASE_PROD_REF=ltrigisoniqcsuamaebj                  # used by the no-direct-prod-db hook
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

## Auth emails (Supabase Auth settings, per project)

The Self-Serve app sends people through `/auth/confirm` after every auth email
(sign-up confirmation, password reset). Set these in each Supabase project
(dashboard → Authentication), dev and prod alike:

- **URL Configuration → Site URL:** the app's main address (dev: `https://build.hio.space`).
- **URL Configuration → Redirect URLs:** add `https://<app domain>/auth/confirm` (and
  `http://localhost:3000/auth/confirm` on dev). A link to an address not on this list falls
  back to the Site URL and the user lands without being signed in.
- **Email Templates (recommended):** so links work when opened on another device, change the
  link in *Confirm signup* to
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard?welcome=1`
  and in *Reset Password* to
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
  The route also accepts Supabase's default links (`?code=`), which only work in the browser
  where the request was made.
- **SMTP Settings (prod, before launch):** Supabase's built-in sender is for testing. It sends
  only a few emails an hour and may deliver only to the project team's addresses. Connect a
  real email service (Resend, Postmark, SES…) with a sender on the hio domain.

A repeated sign-up with an existing email gets a normal-looking success and **no email** (Supabase
hides whether an account exists). The "Check your inbox" screen therefore always offers "log in
or reset your password" instead of promising an email.

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
1. ✅ **Done (confirmed 2026-07-04).** **Link the repo** — on each site, Site configuration → Build & deploy → link `culturenteam/hio-main`
   (authorize the Netlify GitHub App for the private repo). Use Netlify's monorepo **Package directory**
   field (`apps/studio` / `apps/self-serve`), leaving **Base directory** at `/` (repo root — required for
   npm workspaces to resolve). Set **production branch = `integration/v2`**. **Gotcha:** each app's
   `netlify.toml` `publish` path must then be written **relative to the repo root** (e.g.
   `apps/self-serve/.next`), not relative to the app dir — Netlify resolves `netlify.toml`'s relative
   paths against Base directory, not Package directory, and a dashboard-set Publish directory is
   overridden by whatever `netlify.toml` declares.
2. **Self-Serve secret** — add `SUPABASE_SERVICE_ROLE_KEY` (server-only, **not** `NEXT_PUBLIC_`) from
   the dev Supabase project's API settings. Studio needs no service-role key.
3. **Domains** — Studio: add `studio.hio.space` as the primary domain + each test client domain (e.g.
   `acme.hio.space`) as a **domain alias** (that is what M4.8 resolves). Self-Serve: add `app.hio.space`.
   Point DNS at Netlify so certs issue.
4. Trigger the first deploy (push / "Deploy site").

## What's connected today
- ✅ **dev** Supabase wired (this account, `Hio` project) — `.env.local` set for both apps.
  > The dev project is on the **free tier and auto-pauses** after about a week without activity
  > (it did between July and November 2026). When it's paused its hostname stops resolving and both
  > apps fail to sign in or render pages. Restore it from the Supabase dashboard.
- 🔵 **Netlify** — both monorepo sites created, public env set, repo linked, auto-deploying from
  `integration/v2`. Outstanding: the Self-Serve service-role secret (unverified) and the domains.
  Old exploration sites untouched.
- 🔵 **prod** Supabase — **project created** in the separate account (2026-06-22, ref
  `ltrigisoniqcsuamaebj`); `SUPABASE_PROD_REF` recorded above. **Still outstanding** (owner, can't be done
  from the dev account): add the GitHub Actions secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROD_REF`,
  `SUPABASE_PROD_DB_PASSWORD`), set the Netlify *Production* context env (prod URL + anon key + the
  Self-Serve service-role key), and set repo var `PROD_DB_DEPLOY_ENABLED=true`. The prod schema is empty
  until the first merge to `main` runs `db-deploy.yml` (the 16 migrations, `0000`–`015`).
  > **MCP note:** a prod Supabase MCP should NOT be wired into the agent as a read-write `mcp__supabase`
  > server — prod changes go through CI only (rule #1). If a prod MCP is connected at all, make it
  > **read-only** + a **distinct name** (e.g. `supabase-prod`, not "supabase" — that collides with the dev
  > server in `.mcp.json`) and set `SUPABASE_PROD_REF` so `no-direct-prod-db.mjs` can guard it.
