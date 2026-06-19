-- 005_security_hardening.sql
-- Fixes issues found while porting builder's schema onto the guardrails.
-- Migrations are append-only, so we fix forward here rather than editing 001/002/004.

-- ── Fix 1: duplicate sections INSERT policy bypassed the tier gate ────────────
-- 004 tried to DROP "Users can insert own sections" (which never existed — 001
-- created "sections_insert_own"), so BOTH policies were live. Postgres ORs
-- permissive policies, so the un-tier-checked 001 policy let any module type be
-- inserted. Drop it; the tier-enforcing policy from 004 becomes the sole INSERT policy.
DROP POLICY IF EXISTS "sections_insert_own" ON public.sections;

-- ── Fix 2: pin search_path on all SECURITY DEFINER / SQL functions ────────────
-- A mutable search_path on SECURITY DEFINER functions is a privilege-escalation
-- vector (Supabase advisor 0011). Pin it explicitly; bodies reference public objects.
ALTER FUNCTION public.update_updated_at_column()    SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user()             SET search_path = public, pg_temp;
ALTER FUNCTION public.is_active_user()              SET search_path = public, pg_temp;
ALTER FUNCTION public.allowed_module_types()        SET search_path = public, pg_temp;

-- ── Fix 3: reorder_sections IDOR — add ownership guard ────────────────────────
-- It is SECURITY DEFINER (bypasses RLS) and only matched on page_id, so a signed-in
-- user could reorder another user's sections by passing their page_id + section ids.
-- Require the caller to own the page.
CREATE OR REPLACE FUNCTION public.reorder_sections(p_page_id uuid, p_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.pages WHERE id = p_page_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not your page';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    UPDATE public.sections
      SET "order" = (item->>'order')::integer
      WHERE id = (item->>'id')::uuid AND page_id = p_page_id;
  END LOOP;
END;
$$;

-- ── Fix 4: trigger-only functions should not be callable via REST RPC ─────────
-- (advisors 0028/0029). Revoking EXECUTE does not affect trigger firing.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()          FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
