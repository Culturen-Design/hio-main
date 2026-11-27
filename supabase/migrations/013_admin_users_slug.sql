-- 013_admin_users_slug.sql
-- Admin slug source off `pages` (unblocks the CONTRACT migration).
--
-- The admin console labels each user by their public slug. It used to read the
-- world-readable `pages` table for that, but `pages` is being dropped in the
-- CONTRACT phase. The slug now lives on the user's self_serve `sites` row, reachable
-- only through member-scoped RLS (tenant_members → tenants → sites) — an admin cannot
-- read other users' membership rows. So we extend the existing admin RPC
-- (SECURITY DEFINER, admin-gated) to also return each user's self_serve site slug,
-- giving the console an admin-readable user→slug source with no `pages` dependency.
--
-- Return type changes (adds `slug`), so the function is DROPped then recreated.
-- We also pin search_path (the original left it mutable) and explicitly revoke
-- EXECUTE from anon/public — Postgres default-grants EXECUTE to PUBLIC on a new
-- function, and Supabase exposes anon + authenticated, so an unauthenticated caller
-- could otherwise reach it (it would self-reject on the is_admin gate, but we deny
-- it at the grant layer too — defense in depth).

DROP FUNCTION IF EXISTS public.get_auth_users_for_admin();

CREATE FUNCTION public.get_auth_users_for_admin()
RETURNS TABLE(id uuid, email text, created_at timestamptz, slug text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_settings
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin only';
  END IF;

  RETURN QUERY
    SELECT
      au.id,
      au.email::text,
      au.created_at,
      -- The caller's self_serve site slug (== the old page.slug). Scalar subquery so
      -- the result is exactly one row per user even if membership later fans out.
      (SELECT s.slug
         FROM public.sites s
         JOIN public.tenants t        ON t.id = s.tenant_id AND t.kind = 'self_serve'
         JOIN public.tenant_members m ON m.tenant_id = t.id
        WHERE m.user_id = au.id
        ORDER BY s.created_at
        LIMIT 1) AS slug
    FROM auth.users au;
END;
$$;

-- Admin-only RPC: deny anon (and the implicit PUBLIC grant), allow authenticated.
-- The function still self-gates on is_admin; this is the grant-layer backstop.
REVOKE EXECUTE ON FUNCTION public.get_auth_users_for_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_users_for_admin() TO authenticated;
