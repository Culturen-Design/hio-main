-- 008_create_studio_client.sql
-- M4.3b — Studio client onboarding RPC.
--
-- Migration 007 created the unified tenant model and noted: "tenants INSERT/DELETE
-- only via a (future) SECURITY DEFINER RPC — no policy means direct writes are
-- denied." This is that RPC. Creating a Studio client is an INSERT, not provisioning
-- (docs/TENANCY.md): one tenant row (kind='studio_client') + owner membership + a
-- site + seeded template sections, in a single transactional call.
--
-- Authorization: agency staff only, reusing the existing user_settings.is_admin flag
-- (the M2.5b admin gate) — no new role table. The function is SECURITY DEFINER (so it
-- can write the RLS-protected tenant tables) and therefore does the authz check itself.

CREATE OR REPLACE FUNCTION public.create_studio_client(
  p_name           text,
  p_slug           text,
  p_schema_variant text DEFAULT 'self-serve',
  p_theme          jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller    uuid := auth.uid();
  v_is_admin  boolean;
  v_tenant_id uuid;
  v_site_id   uuid;
BEGIN
  -- Authn: must be a signed-in user.
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Authz: agency staff only (= is_admin). Bypassing RLS via SECURITY DEFINER means
  -- this gate is the authority on who may create clients.
  SELECT is_admin INTO v_is_admin FROM public.user_settings WHERE user_id = v_caller;
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'not authorized: agency staff only' USING ERRCODE = '42501';
  END IF;

  -- Validate inputs up front for clear errors (table constraints also enforce slug shape).
  IF coalesce(btrim(p_name), '') = '' THEN
    RAISE EXCEPTION 'client name is required' USING ERRCODE = '22023';
  END IF;
  IF p_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'invalid slug "%": use lowercase letters, numbers, and hyphens', p_slug
      USING ERRCODE = '22023';
  END IF;

  -- Slug is shared across the public surface (tenants/sites/pages) — fail clearly
  -- before hitting a raw unique-constraint violation.
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = p_slug)
     OR EXISTS (SELECT 1 FROM public.sites WHERE slug = p_slug)
     OR EXISTS (SELECT 1 FROM public.pages WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'slug "%" is already taken', p_slug USING ERRCODE = '23505';
  END IF;

  -- Tenant (the client record).
  INSERT INTO public.tenants (kind, name, slug, schema_variant, theme)
    VALUES ('studio_client', p_name, p_slug, p_schema_variant, coalesce(p_theme, '{}'::jsonb))
    RETURNING id INTO v_tenant_id;

  -- The creating staff member owns it (so the membership RLS lets them manage it).
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
    VALUES (v_tenant_id, v_caller, 'owner');

  -- Content root. Starts unpublished — the agency publishes when ready (M4.6).
  INSERT INTO public.sites (tenant_id, slug, title, is_published)
    VALUES (v_tenant_id, p_slug, p_name, false)
    RETURNING id INTO v_site_id;

  -- Seed a starter hero (the "template") so the client opens with editable content.
  -- style_variant/order/width fall to their column defaults (minimal/0/12).
  INSERT INTO public.sections (tenant_id, site_id, type, content)
    VALUES (v_tenant_id, v_site_id, 'hero',
      jsonb_build_object('headline', p_name, 'subheadline', 'Welcome.'));

  RETURN v_tenant_id;
END;
$$;

-- Only authenticated users may call it; the internal is_admin check further narrows
-- to agency staff. Supabase's default privileges grant EXECUTE on new public
-- functions to anon AND authenticated explicitly, so REVOKE FROM public is not
-- enough — revoke anon's grant by name to actually block unauthenticated callers.
REVOKE EXECUTE ON FUNCTION public.create_studio_client(text, text, text, jsonb) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.create_studio_client(text, text, text, jsonb) TO authenticated;
