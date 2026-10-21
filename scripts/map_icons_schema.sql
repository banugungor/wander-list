-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.
--
-- Small illustrated icons of buildings/monuments that the trip map
-- (components/trip-map.tsx) draws above a stop's position instead of a plain
-- numbered pin. One icon per place; a place with no row keeps the plain pin.
-- `item_key` is "<category>:<id>" — "landmarks:<landmarks.id>" or
-- "heritage:<heritage site id>" (data/mapIcons.ts builds it with
-- `mapIconKey`). No foreign key, because heritage sites are not a table and a
-- typo'd key would just never match anything, same as heritage_images.
-- Icons are transparent WebP/PNG added from the admin panel's "Harita ikonu"
-- tab (which also cuts out the background) and uploaded to the existing public
-- `content-images` bucket under `map-icons/` (content_images_bucket.sql must
-- have been run first). The app reads the table once per session.
create table if not exists public.map_icons (
  item_key text primary key,
  image_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.map_icons enable row level security;

-- Readable by everyone, including signed-out users.
drop policy if exists "Anyone can read map icons" on public.map_icons;
create policy "Anyone can read map icons"
  on public.map_icons
  for select
  using (true);

-- Only the admin account can add/replace/remove icons (same rule as
-- admin_panel_policies.sql). Replace <ADMIN_EMAIL> with the admin account's
-- email before running; it is deliberately not committed.
drop policy if exists "Admin can write map icons" on public.map_icons;
create policy "Admin can write map icons"
  on public.map_icons
  for all
  using (auth.jwt() ->> 'email' = '<ADMIN_EMAIL>')
  with check (auth.jwt() ->> 'email' = '<ADMIN_EMAIL>');
