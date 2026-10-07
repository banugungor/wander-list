-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.

-- Trip plans ("Seyahatlerim"). Unlike the visited-lists in `user_backups`
-- (device-first, cloud only as a backup), trips live in Supabase as the
-- source of truth: the app reads and writes this table directly and only
-- keeps an AsyncStorage copy as an offline read cache. One row per trip, so
-- editing one trip never overwrites another (no whole-account blob).
--
-- Private by design: RLS scopes every operation to the owner, nobody else
-- can read a trip. There is no sharing yet.
--
-- The "first trip free, second needs membership" rule is enforced in the
-- app (data/subscription.ts canCreateTrip), not here — the database has no
-- idea who is a RevenueCat member. The per-user cap below only exists as an
-- abuse guard (someone calling the API directly with the public anon key).
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  -- Optional: the `id` from data/worldCountries.json (e.g. "792"), only used
  -- to show a flag on the trip card. Free text trips (e.g. "Bali") leave it null.
  country_id text,
  start_date date,
  end_date date,
  -- Ordered list of days:
  --   [{ "id": "...", "title": "Ubud Exploration",
  --      "activities": [{ "id": "...", "text": "Sacred Monkey Forest" }] }]
  -- Kept as one jsonb value so a whole trip loads in one query and saves in
  -- one write. The size check stops a runaway/abusive payload.
  days jsonb not null default '[]'
    check (jsonb_typeof(days) = 'array' and octet_length(days::text) < 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index if not exists trips_user_updated_idx
  on public.trips (user_id, updated_at desc);

alter table public.trips enable row level security;

drop policy if exists "Users manage their own trips" on public.trips;
create policy "Users manage their own trips"
  on public.trips
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at honest even if a client forgets to send it.
create or replace function public.trips_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_touch_updated_at on public.trips;
create trigger trips_touch_updated_at
  before update on public.trips
  for each row execute function public.trips_touch_updated_at();

-- Abuse guard: at most 50 trips per user.
create or replace function public.trips_enforce_cap()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.trips where user_id = new.user_id) >= 50 then
    raise exception 'trip limit reached';
  end if;
  return new;
end;
$$;

drop trigger if exists trips_enforce_cap on public.trips;
create trigger trips_enforce_cap
  before insert on public.trips
  for each row execute function public.trips_enforce_cap();
