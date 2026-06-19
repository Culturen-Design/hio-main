-- 0000_init.sql — initial schema.
-- RULE: migrations are append-only and immutable once committed. Never edit an
-- applied migration; create a new one. All DDL goes through this directory.
-- Every table that holds user data MUST enable RLS (the security-reviewer enforces this).

create extension if not exists "uuid-ossp";

-- Example domain table. Replace with your own; kept here to demonstrate the pattern:
-- RLS on, owner-scoped policies, updated_at trigger.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
