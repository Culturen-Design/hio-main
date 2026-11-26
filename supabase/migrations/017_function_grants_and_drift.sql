-- 017_function_grants_and_drift.sql
-- Finishes the 016 follow-ups: (1) the dev-vs-repo drift audit, (2) EXECUTE grants on
-- the SECURITY DEFINER helpers. Grants only — no table, policy or function-body changes.
--
-- ── 1. Drift audit (dev yfvqmzaqhayveqllchuh, 2026-11-26) ──────────────────────
-- Dev's migration history has five hand-applied May 2026 entries with no repo file:
-- admin_helpers, fix_rls_recursion, 007_public_read_policies,
-- 008_drop_recursive_rls_policies, 009_rls_fixes_and_catchup. Their recorded statements
-- (supabase_migrations.schema_migrations) were compared with live dev pg_proc,
-- pg_policies, pg_trigger, indexes, enums and function/table ACLs in `public`:
--   * Everything they created on `pages` (policies "Public can read pages",
--     pages_delete_own) went away with the table in 014; "Public can read sections" was
--     dropped by name in 014.
--   * is_current_user_admin(), get_all_user_settings_for_admin() and the user_settings
--     policies were redefined to the same end state by 016.
--   * get_auth_users_for_admin() was replaced by 013 (dev body matches the repo apart
--     from one comment line).
--   * Every other public function body matches the repo byte-for-byte (md5 of prosrc),
--     and the policy, trigger, index and enum sets match the repo's end state.
-- So no object exists only on dev, and nothing needs to be re-created here. The function
-- ACLs also already match what a repo-built DB gets (Supabase default privileges grant
-- EXECUTE to anon/authenticated/service_role, plus Postgres' implicit PUBLIC grant).
-- This migration changes those ACLs the same way on both.
--
-- ── 2. Grants ─────────────────────────────────────────────────────────────────
-- Note: REVOKE ... FROM anon alone does nothing while the PUBLIC grant remains (anon
-- inherits it). That is why 005's revoke on the trigger functions never took effect
-- (advisor 0028 still flags handle_new_user). Each revoke below includes PUBLIC.
-- service_role keeps its explicit default-privilege grant throughout.

-- Admin check. Its only callers are the two user_settings policies (016), both
-- `to authenticated`, and get_all_user_settings_for_admin() (runs as owner). No app or
-- edge-function .rpc() caller.
revoke execute on function public.is_current_user_admin() from public, anon;
grant  execute on function public.is_current_user_admin() to authenticated;

-- Trigger-only functions (on_auth_user_created, update_*_updated_at). Postgres checks
-- EXECUTE on a trigger function only at CREATE TRIGGER time, not when it fires, so
-- revoking from every client role leaves sign-up provisioning and updated_at untouched.
revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;

-- Used only by the sections INSERT/UPDATE policies (012), which anon can never satisfy
-- (no tenant membership). allowed_module_types() is also called by the signed-in
-- self-serve builder (apps/self-serve/.../builder/page.tsx). Signed-in users keep both.
revoke execute on function public.is_active_user()       from public, anon;
revoke execute on function public.allowed_module_types() from public, anon;
grant  execute on function public.is_active_user()       to authenticated;
grant  execute on function public.allowed_module_types() to authenticated;

-- Deliberately unchanged:
--   * is_tenant_member(uuid) stays callable by anon. It is evaluated for anon by
--     SELECT policies anon can hit: sites_select_public (`is_published OR
--     is_tenant_member(...)`) and sections_write_studio_member (FOR ALL, so it also
--     applies to SELECT). Revoking it would turn anon reads of published sites and
--     sections into permission errors. It only answers "is auth.uid() a member", which
--     is always false for anon, so nothing leaks.
--   * get_public_site / get_public_site_by_domain: public render endpoints (009/011).
--   * get_auth_users_for_admin, get_all_user_settings_for_admin, create_studio_client,
--     snapshot_site, restore_site_version: already authenticated-only (008/010/013/016),
--     each with an internal admin or membership check.
