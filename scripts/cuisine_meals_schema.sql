-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.

-- Master content table: you manage rows here (Table Editor or SQL), the app
-- only ever reads it. Upload dish photos to Supabase Storage (a public
-- bucket) and paste the public URL into image_url.
create table if not exists public.cuisine_meals (
  id bigint generated always as identity primary key,
  -- Matches the `id` field in data/worldCountries.json (e.g. "792" = Turkey),
  -- the same id the rest of the app already uses for countries.
  country_id text not null,
  name text not null,
  name_tr text,
  -- Optional: which city/region within the country this dish is from, for
  -- the country screen's city filter. Leave null for a nationwide dish.
  city text,
  city_tr text,
  description text,
  description_tr text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Safe to run against an already-created table too.
alter table public.cuisine_meals add column if not exists city text;
alter table public.cuisine_meals add column if not exists city_tr text;

create index if not exists cuisine_meals_country_id_idx
  on public.cuisine_meals (country_id);

-- Lets inserts use `on conflict (country_id, name) do nothing` so re-running
-- an insert script (e.g. pasting it into the SQL Editor twice by mistake)
-- doesn't create a second row for the same dish.
create unique index if not exists cuisine_meals_country_name_uidx
  on public.cuisine_meals (country_id, name);

alter table public.cuisine_meals enable row level security;

-- Readable by everyone, including signed-out users — this is shared content,
-- not per-user data. No insert/update/delete policy is defined, so writes
-- only happen from the Supabase dashboard (which uses the service role and
-- bypasses RLS), never from the app.
drop policy if exists "Anyone can read cuisine meals" on public.cuisine_meals;
create policy "Anyone can read cuisine meals"
  on public.cuisine_meals
  for select
  using (true);

-- Extends the user_backups table (see user_backups_schema.sql) with a slot
-- for the rebuilt cuisine feature's "tasted" meal ids.
alter table public.user_backups
  add column if not exists cuisine_visited jsonb not null default '[]';
