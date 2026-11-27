-- 009_get_public_site.sql
-- M4.6 — Public site rendering by slug.
--
-- A published Studio client's content must be readable by anonymous visitors. The
-- `sites` (is_published) and `sections` (USING true) SELECT policies already allow
-- that, but the per-tenant `theme` lives on `tenants`, whose SELECT is member-only
-- (tenants_select_member, migration 007). Rather than open the whole tenants row to
-- anon, this SECURITY DEFINER function returns ONLY the public-facing fields of a
-- PUBLISHED site — title, the tenant name + theme, and the ordered sections — in one
-- anon-callable round trip. Unpublished or unknown slugs return NULL (→ 404).
--
-- Decision record: docs/ROADMAP.md (M4.6) — get_public_site RPC over a public
-- tenants RLS policy, to avoid leaking plan/schema_variant/kind to anon.

CREATE OR REPLACE FUNCTION public.get_public_site(p_slug text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'site_slug',   s.slug,
    'title',       s.title,
    'tenant_name', t.name,
    'theme',       t.theme,
    'sections',    COALESCE(
      (SELECT jsonb_agg(
                jsonb_build_object(
                  'id',            se.id,
                  'type',          se.type,
                  'content',       se.content,
                  'style_variant', se.style_variant,
                  'width',         se.width
                )
                ORDER BY se."order")
       FROM public.sections se
       WHERE se.site_id = s.id),
      '[]'::jsonb)
  )
  FROM public.sites s
  JOIN public.tenants t ON t.id = s.tenant_id
  WHERE s.slug = p_slug
    AND s.is_published = true
  LIMIT 1;
$$;

-- Public endpoint: anonymous visitors render published sites, so anon may execute.
-- The function only ever returns published-site public fields, so this is intentional
-- (it will show in the anon SECURITY DEFINER advisor by design).
GRANT EXECUTE ON FUNCTION public.get_public_site(text) TO anon, authenticated;
