-- 007_tenancy_expand.sql
-- M4.1 — Tenancy unification, EXPAND phase.
--
-- Introduces the unified tenant model (docs/TENANCY.md): ONE `tenants` table where
-- a Self-Serve user's space and a Studio client are both tenants (distinguished by
-- `kind`), `tenant_members` for who-may-manage, and `sites` as the content root.
-- `sections` gains nullable `tenant_id`/`site_id` and is backfilled from existing
-- `pages`, so the live Self-Serve product keeps working on its current columns.
--
-- This is the EXPAND step of an expand → migrate → contract rollout:
--   * MIGRATE  (later): switch the Self-Serve app + edge fn to read/write sites/sections.
--   * CONTRACT (later): make tenant_id/site_id NOT NULL, drop pages + legacy
--                       page-based section policies + page_id.
-- Decision record: docs/ROADMAP.md deviation log (2026-06-21) — unified model
-- (over the roadmap's clients/client_sites naming) + big-bang (migrate Self-Serve too).

-- ── Tenant model ──────────────────────────────────────────────────────────────
CREATE TYPE tenant_kind AS ENUM ('self_serve', 'studio_client');

CREATE TABLE IF NOT EXISTS tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind           tenant_kind NOT NULL,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  theme          JSONB NOT NULL DEFAULT '{}',          -- design tokens / layout (@hio/ui)
  schema_variant TEXT NOT NULL DEFAULT 'self-serve',   -- which SchemaProvider to resolve
  plan           TEXT NOT NULL DEFAULT 'free',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_members (
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON tenant_members(user_id);

CREATE TABLE IF NOT EXISTS sites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title        TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sites_tenant_idx ON sites(tenant_id);

-- updated_at triggers (same pattern + pinned function as 001/005)
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Membership helper (used by RLS; SECURITY DEFINER so it can read members) ───
CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members m
    WHERE m.tenant_id = p_tenant_id AND m.user_id = auth.uid()
  );
$$;

-- ── Expand `sections`: tenant/site scope (nullable now; NOT NULL in CONTRACT) ──
-- page_id must become nullable so Studio sections (which have no `pages` row) fit.
ALTER TABLE sections ALTER COLUMN page_id DROP NOT NULL;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS site_id   UUID REFERENCES sites(id)   ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS sections_tenant_idx     ON sections(tenant_id);
CREATE INDEX IF NOT EXISTS sections_site_order_idx ON sections(site_id, "order");

-- ── Backfill: every existing Self-Serve page → tenant + owner + site ──────────
-- Idempotent (guards on slug/membership), so a re-run is a no-op.
DO $$
DECLARE
  pg          RECORD;
  v_tenant_id UUID;
  v_site_id   UUID;
BEGIN
  FOR pg IN SELECT * FROM public.pages LOOP
    SELECT id INTO v_tenant_id FROM public.tenants
      WHERE slug = pg.slug AND kind = 'self_serve';
    IF v_tenant_id IS NULL THEN
      INSERT INTO public.tenants (kind, name, slug, schema_variant)
        VALUES ('self_serve', COALESCE(pg.title, pg.slug), pg.slug, 'self-serve')
        RETURNING id INTO v_tenant_id;
    END IF;

    INSERT INTO public.tenant_members (tenant_id, user_id, role)
      VALUES (v_tenant_id, pg.user_id, 'owner')
      ON CONFLICT (tenant_id, user_id) DO NOTHING;

    SELECT id INTO v_site_id FROM public.sites WHERE tenant_id = v_tenant_id;
    IF v_site_id IS NULL THEN
      INSERT INTO public.sites (tenant_id, slug, title, is_published)
        VALUES (v_tenant_id, pg.slug, pg.title, true)
        RETURNING id INTO v_site_id;
    END IF;

    UPDATE public.sections SET tenant_id = v_tenant_id, site_id = v_site_id
      WHERE page_id = pg.id;
  END LOOP;
END $$;

-- ── Keep new Self-Serve signups consistent with the unified model ─────────────
-- Provision a tenant + owner-membership + site, and stamp the seeded hero with
-- tenant_id/site_id. Legacy pages/sections are still written (the live app reads
-- them until the MIGRATE phase). CREATE OR REPLACE resets unspecified attributes,
-- so re-pin search_path (005) here; the 005 REVOKE from anon/authenticated persists.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_slug   TEXT;
  final_slug  TEXT;
  counter     INTEGER := 0;
  v_tenant_id UUID;
  v_site_id   UUID;
  v_page_id   UUID;
BEGIN
  base_slug  := regexp_replace(lower(split_part(NEW.email, '@', 1)), '[^a-z0-9]', '-', 'g');
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.pages   WHERE slug = final_slug)
     OR EXISTS (SELECT 1 FROM public.tenants WHERE slug = final_slug)
     OR EXISTS (SELECT 1 FROM public.sites   WHERE slug = final_slug) LOOP
    counter    := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);

  INSERT INTO public.tenants (kind, name, slug, schema_variant)
    VALUES ('self_serve', 'My page', final_slug, 'self-serve')
    RETURNING id INTO v_tenant_id;
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
    VALUES (v_tenant_id, NEW.id, 'owner');
  INSERT INTO public.sites (tenant_id, slug, title, is_published)
    VALUES (v_tenant_id, final_slug, 'My page', true)
    RETURNING id INTO v_site_id;

  INSERT INTO public.pages (user_id, slug, title)
    VALUES (NEW.id, final_slug, 'My page')
    RETURNING id INTO v_page_id;
  INSERT INTO public.sections (page_id, tenant_id, site_id, type, content, style_variant, "order", width)
    VALUES (v_page_id, v_tenant_id, v_site_id, 'hero',
      '{"headline":"Hello, I''m ...","subheadline":"Welcome to my page."}'::jsonb,
      'minimal', 0, 12);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE tenants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites          ENABLE ROW LEVEL SECURITY;

-- tenants: members read + update theirs. INSERT/DELETE only via a (future) SECURITY
-- DEFINER RPC — no policy means direct writes are denied.
CREATE POLICY "tenants_select_member" ON tenants FOR SELECT
  USING (is_tenant_member(id));
CREATE POLICY "tenants_update_member" ON tenants FOR UPDATE
  USING (is_tenant_member(id)) WITH CHECK (is_tenant_member(id));

-- tenant_members: a member can see the membership of tenants they belong to.
CREATE POLICY "members_select" ON tenant_members FOR SELECT
  USING (is_tenant_member(tenant_id));

-- sites: published sites are public; members manage their own.
CREATE POLICY "sites_select_public" ON sites FOR SELECT
  USING (is_published OR is_tenant_member(tenant_id));
CREATE POLICY "sites_write_member" ON sites FOR ALL
  USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id));

-- sections: add a STUDIO-ONLY membership write path. Scoping to kind='studio_client'
-- means Self-Serve sections remain governed solely by their existing (tier-gated,
-- page-based) policies — this expand step never widens Self-Serve access. SELECT is
-- already public via "sections_select_public" (001).
CREATE POLICY "sections_write_studio_member" ON sections FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.tenants t
            WHERE t.id = sections.tenant_id AND t.kind = 'studio_client'
              AND is_tenant_member(t.id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenants t
            WHERE t.id = sections.tenant_id AND t.kind = 'studio_client'
              AND is_tenant_member(t.id))
  );
