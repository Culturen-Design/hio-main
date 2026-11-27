-- 006_drop_legacy_profiles.sql
-- 0000_init.sql was a scaffold from the starter template — its `profiles` table is
-- NOT part of hio (the real schema is user_settings/pages/sections from 001+).
-- Migrations are append-only, so instead of editing/deleting 0000 we remove the
-- scaffold objects here. Net effect on a fresh DB: profiles is created then dropped.
drop table if exists public.profiles cascade;        -- also drops its policies + trigger
drop function if exists public.set_updated_at() cascade;
