-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.
--
-- Stylised vector base maps of single cities that the trip map
-- (components/trip-map.tsx) draws a trip's route on. One row per city; the
-- app first reads just (id, bbox, updated_at) of every row to pick the city a
-- trip's stops fall in (data/cityMapStore.ts), then fetches that one city's
-- full row and caches it on the device keyed by `updated_at`, so adding a
-- city never grows the app and a map is downloaded at most once per change.
--
-- The rows are generated from OpenStreetMap (ODbL — the map component always
-- prints "© OpenStreetMap contributors") by scripts/build-city-map.mjs, which
-- writes scripts/city_maps/<id>.sql; run that file here after this one.
-- Layer columns are SVG path data in "map units" (a `width` × `height`
-- space); `bbox` is the lat/lng frame they were projected from.
create table if not exists public.city_maps (
  id text primary key,
  name text not null,
  name_tr text not null,
  bbox jsonb not null,            -- {south, west, north, east}
  width double precision not null,
  height double precision not null,
  labels jsonb not null default '[]'::jsonb,  -- [{text, textTr, x, y, kind}]
  water text not null default '',
  green text not null default '',
  rivers text not null default '',
  canals text not null default '',
  minor text not null default '',
  major text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.city_maps enable row level security;

-- Readable by everyone, including signed-out users.
drop policy if exists "Anyone can read city maps" on public.city_maps;
create policy "Anyone can read city maps"
  on public.city_maps
  for select
  using (true);

-- Only the admin account can write (same rule as admin_panel_policies.sql);
-- the generated scripts/city_maps/*.sql files are run from the SQL Editor,
-- which bypasses RLS anyway. Replace <ADMIN_EMAIL> with the admin account's
-- email before running; it is deliberately not committed.
drop policy if exists "Admin can write city maps" on public.city_maps;
create policy "Admin can write city maps"
  on public.city_maps
  for all
  using (auth.jwt() ->> 'email' = '<ADMIN_EMAIL>')
  with check (auth.jwt() ->> 'email' = '<ADMIN_EMAIL>');
