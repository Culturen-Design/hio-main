-- 014_contract_drop_pages.sql
-- CONTRACT phase (late M4) — retire the legacy page-based schema now that Self-Serve
-- reads/writes exclusively via the unified tenants/sites/sections keys (PRs #25–#28).
--
-- This is the destructive end of the expand → migrate → contract rewrite started in
-- migration 007. By this point every section is dual-keyed (tenant_id + site_id are
-- backfilled and populated on every insert) and NO app or edge code reads `pages` or
-- `page_id` for behavior — verified by grep before authoring this migration. So we can
-- safely drop the legacy surface:
--   1. the legacy page-based section RLS policies (superseded by the membership policies
--      in 012 + the studio policy in 007),
--   2. the now-mandatory tenancy keys → NOT NULL,
--   3. `sections.page_id` (drops its FK + unused index),
--   4. the dead page-keyed `reorder_sections` RPC (both products reorder via order-value
--      swaps now — see apps/*/builder/actions.ts),
--   5. the `pages` table itself (cascading its own RLS policies),
--   6. `handle_new_user` rewritten to seed only tenant + membership + site + hero (no page),
--   7. `create_studio_client` — drop its `pages` slug-collision check.
--
-- The `ai-command` edge function's legacy `{ page_id }` branch is removed in the same PR
-- (code, redeployed as v7). After this, `pages`/`page_id` exist nowhere in the system.

-- 1. Drop the legacy page-based section policies (page-ownership keyed via pages.user_id).
--    Writes are covered by sections_{insert,update,delete}_self_serve_member (012, which
--    preserves the tier gate) + sections_write_studio_member (007); public read by
--    sections_select_public (USING true). Dropping these also clears the duplicate-policy
--    perf advisories on sections.
drop policy if exists "Public can read sections"     on public.sections;
drop policy if exists "Users can insert own sections" on public.sections;
drop policy if exists sections_update_own            on public.sections;
drop policy if exists sections_delete_own            on public.sections;

-- 2. The unified tenancy keys are now populated on every row — make them mandatory.
alter table public.sections alter column tenant_id set not null;
alter table public.sections alter column site_id   set not null;

-- 3. Drop the legacy page link (removes sections_page_id_fkey + sections_page_id_idx).
alter table public.sections drop column page_id;

-- 4. Drop the dead page-keyed reorder RPC (page-ownership + page_id keyed; unused).
drop function if exists public.reorder_sections(uuid, jsonb);

-- 5. Drop the legacy pages table (cascades pages_* RLS policies).
drop table if exists public.pages;

-- 6. Provisioning trigger: seed the unified model only — no more pages row. (CREATE OR
--    REPLACE preserves the trigger binding from 001/003; search_path re-pinned per the
--    SECURITY DEFINER rule.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_slug   text;
  final_slug  text;
  counter     integer := 0;
  v_tenant_id uuid;
  v_site_id   uuid;
begin
  base_slug  := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9]', '-', 'g');
  final_slug := base_slug;
  while exists (select 1 from public.tenants where slug = final_slug)
     or exists (select 1 from public.sites   where slug = final_slug) loop
    counter    := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  insert into public.user_settings (user_id) values (new.id);

  insert into public.tenants (kind, name, slug, schema_variant)
    values ('self_serve', 'My page', final_slug, 'self-serve')
    returning id into v_tenant_id;
  insert into public.tenant_members (tenant_id, user_id, role)
    values (v_tenant_id, new.id, 'owner');
  insert into public.sites (tenant_id, slug, title, is_published)
    values (v_tenant_id, final_slug, 'My page', true)
    returning id into v_site_id;

  insert into public.sections (tenant_id, site_id, type, content, style_variant, "order", width)
    values (v_tenant_id, v_site_id, 'hero',
      '{"headline":"Hello, I''m ...","subheadline":"Welcome to my page."}'::jsonb,
      'minimal', 0, 12);

  return new;
end;
$$;

-- 7. Studio client creation: drop the now-impossible pages slug check (keep tenants/sites).
--    CREATE OR REPLACE preserves the anon EXECUTE revoke from 008.
create or replace function public.create_studio_client(
  p_name text,
  p_slug text,
  p_schema_variant text default 'self-serve',
  p_theme jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller    uuid := auth.uid();
  v_is_admin  boolean;
  v_tenant_id uuid;
  v_site_id   uuid;
begin
  if v_caller is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select is_admin into v_is_admin from public.user_settings where user_id = v_caller;
  if v_is_admin is not true then
    raise exception 'not authorized: agency staff only' using errcode = '42501';
  end if;

  if coalesce(btrim(p_name), '') = '' then
    raise exception 'client name is required' using errcode = '22023';
  end if;
  if p_slug !~ '^[a-z0-9-]+$' then
    raise exception 'invalid slug "%": use lowercase letters, numbers, and hyphens', p_slug
      using errcode = '22023';
  end if;

  if exists (select 1 from public.tenants where slug = p_slug)
     or exists (select 1 from public.sites where slug = p_slug) then
    raise exception 'slug "%" is already taken', p_slug using errcode = '23505';
  end if;

  insert into public.tenants (kind, name, slug, schema_variant, theme)
    values ('studio_client', p_name, p_slug, p_schema_variant, coalesce(p_theme, '{}'::jsonb))
    returning id into v_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role)
    values (v_tenant_id, v_caller, 'owner');

  insert into public.sites (tenant_id, slug, title, is_published)
    values (v_tenant_id, p_slug, p_name, false)
    returning id into v_site_id;

  insert into public.sections (tenant_id, site_id, type, content)
    values (v_tenant_id, v_site_id, 'hero',
      jsonb_build_object('headline', p_name, 'subheadline', 'Welcome.'));

  return v_tenant_id;
end;
$$;
