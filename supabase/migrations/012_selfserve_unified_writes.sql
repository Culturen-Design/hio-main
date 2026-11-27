-- 012_selfserve_unified_writes.sql
-- M4 — Self-Serve MIGRATE step (PR A): membership write path for self_serve sections.
--
-- Background: the unified model (007) backfilled every Self-Serve user into a
-- self_serve tenant + published site, and all existing sections already carry
-- tenant_id/site_id (handle_new_user seeds both for new signups too). What remains
-- is to let Self-Serve write sections via tenant MEMBERSHIP (tenant_id/site_id)
-- instead of page ownership (page_id), so the app can stop using pages — and then
-- pages/page_id can be dropped in the CONTRACT phase.
--
-- The legacy page-based policies carry two guards the studio membership policy
-- (sections_write_studio_member, scoped to kind='studio_client') does NOT:
--   * INSERT enforces the TIER GATE: type ∈ allowed_module_types()
--   * UPDATE requires is_active_user()  (locked/disabled accounts can't edit)
-- These new self_serve-scoped policies preserve BOTH guards, so tier limits and
-- account lockout behave exactly as before.
--
-- ADDITIVE: these run ALONGSIDE the legacy page-based policies (permissive OR), so
-- nothing breaks while the app still writes by page_id. The app switches to site_id
-- in PR B; the legacy page policies + page_id are removed in CONTRACT.
--
-- Decision record: docs/ROADMAP.md (M4 — Self-Serve MIGRATE).

-- INSERT: a member of the section's self_serve tenant, tier-gated by module type
-- (mirrors the legacy "Users can insert own sections" WITH CHECK).
CREATE POLICY "sections_insert_self_serve_member" ON public.sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = sections.tenant_id
        AND t.kind = 'self_serve'
        AND public.is_tenant_member(t.id)
    )
    AND ((type)::text = ANY (public.allowed_module_types()))
  );

-- UPDATE: a member of the self_serve tenant, and an active account (mirrors the
-- legacy sections_update_own is_active_user guard). WITH CHECK keeps membership so a
-- row can't be reassigned to a tenant the caller doesn't belong to.
CREATE POLICY "sections_update_self_serve_member" ON public.sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = sections.tenant_id
        AND t.kind = 'self_serve'
        AND public.is_tenant_member(t.id)
    )
    AND public.is_active_user()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = sections.tenant_id
        AND t.kind = 'self_serve'
        AND public.is_tenant_member(t.id)
    )
  );

-- DELETE: a member of the self_serve tenant.
CREATE POLICY "sections_delete_self_serve_member" ON public.sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = sections.tenant_id
        AND t.kind = 'self_serve'
        AND public.is_tenant_member(t.id)
    )
  );
