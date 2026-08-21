-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.
--
-- Structured, queryable demographic signals (age group, gender, home
-- country) — kept separate from auth.users' user_metadata so they can
-- later be joined/aggregated for anonymized analytics without exposing
-- individual identity.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  age_group text check (age_group in ('13-17','18-24','25-34','35-44','45-54','55+')),
  gender text check (gender in ('female','male','other')),
  home_country_id text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
