-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.

create table if not exists public.user_backups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  heritage_visited jsonb not null default '[]',
  countries_visited jsonb not null default '[]',
  activity_log jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.user_backups enable row level security;

drop policy if exists "Users manage their own backup" on public.user_backups;
create policy "Users manage their own backup"
  on public.user_backups
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
