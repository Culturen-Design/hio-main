-- 010_site_versions.sql
-- M4.7 — Version history / rollback for Studio sites.
--
-- A version is a WHOLE-SITE snapshot: all of a site's sections captured as one JSONB
-- blob at a point in time. Captured automatically on publish and on demand ("Save
-- version"); restore atomically replaces the current sections with a snapshot.
-- Decision record: docs/ROADMAP.md (M4.7) — whole-site snapshot (not per-section);
-- capture on publish + manual.

CREATE TABLE IF NOT EXISTS site_versions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    UUID NOT NULL REFERENCES sites(id)   ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  label      TEXT NOT NULL DEFAULT 'Version',
  sections   JSONB NOT NULL,                       -- ordered snapshot of the site's sections
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_versions_site_idx ON site_versions(site_id, created_at DESC);

-- ── RLS: members read their tenant's versions; writes go only through the RPCs ──
ALTER TABLE site_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_versions_select_member" ON site_versions FOR SELECT
  USING (is_tenant_member(tenant_id));
-- No INSERT/UPDATE/DELETE policy — capture/restore happen via the SECURITY DEFINER
-- functions below (membership-gated internally), so direct table writes are denied.

-- ── Capture: snapshot the site's current sections into a version row ───────────
CREATE OR REPLACE FUNCTION public.snapshot_site(p_site_id uuid, p_label text DEFAULT 'Manual save')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tenant_id  uuid;
  v_version_id uuid;
BEGIN
  SELECT s.tenant_id INTO v_tenant_id FROM public.sites s WHERE s.id = p_site_id;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'site not found' USING ERRCODE = '42704';
  END IF;
  IF NOT public.is_tenant_member(v_tenant_id) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.site_versions (site_id, tenant_id, label, sections, created_by)
  VALUES (
    p_site_id,
    v_tenant_id,
    COALESCE(NULLIF(btrim(p_label), ''), 'Version'),
    COALESCE(
      (SELECT jsonb_agg(
                jsonb_build_object(
                  'type',          se.type,
                  'content',       se.content,
                  'style_variant', se.style_variant,
                  'width',         se.width,
                  'order',         se."order")
                ORDER BY se."order")
       FROM public.sections se
       WHERE se.site_id = p_site_id),
      '[]'::jsonb),
    auth.uid()
  )
  RETURNING id INTO v_version_id;

  RETURN v_version_id;
END;
$$;

-- ── Restore: replace the site's sections with a snapshot ──────────────────────
-- Snapshots the CURRENT state first ('Before restore') so a restore is itself
-- reversible, then deletes and re-inserts the sections from the version.
CREATE OR REPLACE FUNCTION public.restore_site_version(p_version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_site_id   uuid;
  v_tenant_id uuid;
  v_sections  jsonb;
BEGIN
  SELECT v.site_id, v.tenant_id, v.sections
    INTO v_site_id, v_tenant_id, v_sections
    FROM public.site_versions v WHERE v.id = p_version_id;
  IF v_site_id IS NULL THEN
    RAISE EXCEPTION 'version not found' USING ERRCODE = '42704';
  END IF;
  IF NOT public.is_tenant_member(v_tenant_id) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  PERFORM public.snapshot_site(v_site_id, 'Before restore');

  DELETE FROM public.sections WHERE site_id = v_site_id;

  INSERT INTO public.sections (tenant_id, site_id, type, content, style_variant, width, "order")
  SELECT v_tenant_id, v_site_id,
         (e->>'type')::module_type,
         (e->'content'),
         COALESCE((e->>'style_variant')::style_variant, 'minimal'),
         COALESCE((e->>'width')::int, 12),
         COALESCE((e->>'order')::int, 0)
  FROM jsonb_array_elements(v_sections) AS e;
END;
$$;

-- Membership-gated internally; only signed-in users may call. Block anon (Supabase
-- default-grants EXECUTE to anon + authenticated on new public functions).
REVOKE EXECUTE ON FUNCTION public.snapshot_site(uuid, text)        FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.restore_site_version(uuid)       FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.snapshot_site(uuid, text)        TO authenticated;
GRANT  EXECUTE ON FUNCTION public.restore_site_version(uuid)       TO authenticated;
