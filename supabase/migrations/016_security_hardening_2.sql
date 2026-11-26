-- 016_security_hardening_2.sql
-- Second security/performance pass (Nov 2026 audit, Phase 2). Clears these advisor findings:
--   security    : function_search_path_mutable (x2), anon_security_definer_function_executable
--                 for get_all_user_settings_for_admin
--   performance : unindexed_foreign_keys (x5), auth_rls_initplan (x2)
--
-- Drift note: is_current_user_admin(), get_all_user_settings_for_admin() and the two
-- "Users can ... own settings" policies were applied to dev by hand in May 2026
-- (dev migrations admin_helpers / fix_rls_recursion / 008_drop_recursive_rls_policies)
-- and were never committed. A DB built only from this repo still has the recursive 001
-- policies (settings_select / settings_update_admin) and neither function. This migration
-- therefore (re)defines both functions and drops every known user_settings policy name
-- so it gives the same end state on dev and on a fresh repo-built DB (CI, prod).
--
-- Behaviour change (intentional): the old dev UPDATE policy allowed
-- `user_id = auth.uid()`, so with the default table grants any signed-in user could
-- set their own is_admin / tier / is_locked / is_disabled. All app writes to
-- user_settings come from the admin screens (apps/self-serve/.../admin/actions.ts),
-- so UPDATE is now admin-only, which matches what that code documents.

-- ── 1. Admin helper functions: pin search_path ────────────────────────────────
-- CREATE OR REPLACE keeps the existing owner and grants on dev; bodies are unchanged
-- apart from schema-qualifying the helper call.
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select is_admin from public.user_settings where user_id = auth.uid()),
    false
  );
$$;

create or replace function public.get_all_user_settings_for_admin()
returns setof public.user_settings
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Unauthorized: admin only';
  end if;
  return query select * from public.user_settings;
end;
$$;

-- Admin-only RPC: not callable without signing in.
revoke execute on function public.get_all_user_settings_for_admin() from public, anon;
grant execute on function public.get_all_user_settings_for_admin() to authenticated, service_role;

-- ── 2. Covering indexes for foreign keys ──────────────────────────────────────
create index if not exists ai_messages_tenant_idx    on public.ai_messages   (tenant_id);
create index if not exists ai_sessions_created_by_idx on public.ai_sessions   (created_by);
create index if not exists ai_sessions_tenant_idx    on public.ai_sessions   (tenant_id);
create index if not exists site_versions_created_by_idx on public.site_versions (created_by);
create index if not exists site_versions_tenant_idx  on public.site_versions (tenant_id);

-- ── 3. user_settings policies: initplan-friendly, signed-in only ──────────────
drop policy if exists "settings_select"              on public.user_settings;
drop policy if exists "settings_update_admin"        on public.user_settings;
drop policy if exists "Users can view own settings"   on public.user_settings;
drop policy if exists "Users can update own settings" on public.user_settings;

create policy "Users can view own settings" on public.user_settings
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_current_user_admin()));

create policy "Admins can update settings" on public.user_settings
  for update to authenticated
  using ((select public.is_current_user_admin()))
  with check ((select public.is_current_user_admin()));

-- Follow-ups (not in this migration): consolidate multiple permissive policies on
-- sections/sites; review anon/authenticated EXECUTE on the other SECURITY DEFINER
-- helpers (handle_new_user, is_active_user, is_tenant_member, ...).
