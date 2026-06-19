# TENANCY.md — How hio isolates users and clients

The canonical multi-tenancy model for both products. Read this before touching the
schema or building Studio (M4).

## Two independent axes — never conflate them

| Axis | What it separates | Mechanism |
|------|-------------------|-----------|
| **Environment** | dev vs prod | Separate Supabase **projects/accounts** (dev = current account; prod = separate account) |
| **Tenant** | one user/client from another *within* an environment | **Rows + RLS** in the same database |

Prod is **one database holding every tenant**. A new user or client is a **row**, never a
new project, account, or database.

## The rule: shared schema, row-level tenancy

- One `tenants` table. A **self-serve user's space** and a **Studio client** are both tenants
  (distinguished by `kind`).
- Every content table carries a `tenant_id` FK.
- **RLS** isolates by tenant — nobody can read or write another tenant's rows. This is the same
  model proven in `exploration/hio-builder` (pages/sections + RLS), generalized.

### Onboarding is an INSERT, not provisioning

A new custom-website client =
1. Agency member clicks "New client" in Studio.
2. One `INSERT` into `tenants` (`kind='studio_client'`, name, plan, theme, schema_variant).
3. Create their `site` + seed default `sections` from a **template** (copy rows).
4. Map a domain (Netlify wildcard/edge → looked up by tenant slug).
5. Live and AI-editable.

Seconds, no Supabase signup, no new DB. The schema is **never** built from scratch again.

## Where per-client difference lives (data/config, not databases)

| Difference | Stored as | Resolved by |
|------------|-----------|-------------|
| Look & feel | `theme` config (tokens/fonts/layout) on the tenant | `@hio/ui` |
| Allowed modules / fields / AI tools | `schema_variant` (enabled module set) on the tenant | `@hio/ai-engine` via `SchemaProvider` |
| A bespoke module | added once to `@hio/ui` + registered, **enabled per tenant** | shared code, per-tenant toggle |

This is the entire reason the engine is schema-driven: Studio resolves a **different
SchemaProvider per client at runtime**, over the **same** database and engine.

## Auth model

- **Self-Serve**: end users **self-register** (Supabase Auth) → each becomes a `tenant` (`kind='self_serve'`).
- **Studio**: **your team** are the auth users; a client is a data record. A `tenant_members`
  table maps which auth users may manage which tenants. Optionally a client gets a restricted
  login (an end-editor) scoped by RLS to only their tenant.

## Proposed schema (M4 will turn this into migrations)

```sql
-- A tenant = a self-serve user's space OR a managed client site.
create type tenant_kind as enum ('self_serve', 'studio_client');

create table tenants (
  id            uuid primary key default gen_random_uuid(),
  kind          tenant_kind not null,
  name          text not null,
  slug          text unique not null check (slug ~ '^[a-z0-9-]+$'),
  theme         jsonb not null default '{}',      -- design tokens / layout
  schema_variant text not null default 'default', -- which SchemaProvider to load
  plan          text not null default 'free',
  created_at    timestamptz not null default now()
);

-- Who may manage a tenant (agency staff for Studio; the owner for Self-Serve).
create table tenant_members (
  tenant_id uuid references tenants(id) on delete cascade,
  user_id   uuid references auth.users(id) on delete cascade,
  role      text not null default 'editor',  -- owner | editor
  primary key (tenant_id, user_id)
);

-- Content lives under a tenant. (sites/sections mirror builder's pages/sections.)
create table sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  ...
);
create table sections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  type module_type not null,
  content jsonb not null,
  ...
);
```

### RLS pattern (every tenant-scoped table)

```sql
alter table sections enable row level security;

-- A user can act on a tenant's rows only if they're a member of that tenant.
create policy "members read"  on sections for select
  using (exists (select 1 from tenant_members m
                 where m.tenant_id = sections.tenant_id and m.user_id = auth.uid()));
create policy "members write" on sections for all
  using (exists (select 1 from tenant_members m
                 where m.tenant_id = sections.tenant_id and m.user_id = auth.uid()))
  with check (exists (select 1 from tenant_members m
                 where m.tenant_id = sections.tenant_id and m.user_id = auth.uid()));
-- Published sites are served read-only via a separate public policy keyed on tenant.slug.
```

The AI edit engine writes with the service role **after** verifying the caller is a member of the
target tenant — identical to the JWT+ownership check in `exploration/hio-builder`'s edge function.

## Migrations apply once, to everyone

A schema change is one migration on the shared DB; every tenant gets it. You never re-run setup
per client. (Per-project tenancy would force N migration runs — the thing we explicitly avoid.)

## The one exception — a dedicated project per client

Only when a client *requires* physical isolation (compliance, data residency, BYO Supabase).
Then deploy the **same codebase** against **their** project. It is still **not** "from scratch":
the schema is reproducible from `supabase/migrations`, so it's one `supabase db push`. Treat this
as a premium/enterprise tier, not the default.

## Why this model

- **Cost**: one prod project serves all clients → flat cost regardless of client count.
- **Ops**: one dashboard, one migration history, one place to monitor.
- **Speed**: new client in minutes; the agency scales with zero engineering per client.
