-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.
--
-- One cover photo per country, shown as the background of trip cards and the
-- trip detail header (components/trip-cover.tsx). `country_id` is the id from
-- data/worldCountries.json (the same value as `countries.id`, see
-- countries_schema.sql). A country with no row here just gets the gradient +
-- flag cover. Photos are added from the admin panel's "Ülkeler" tab and
-- uploaded to the existing public `content-images` bucket under `countries/`
-- (content_images_bucket.sql must have been run first). The app reads the
-- table once per session (data/countryImages.ts).
create table if not exists public.country_images (
  -- No foreign key: a typo'd id would just never match anything in the app,
  -- same as heritage_images.
  country_id text primary key,
  image_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.country_images enable row level security;

-- Readable by everyone, including signed-out users.
drop policy if exists "Anyone can read country images" on public.country_images;
create policy "Anyone can read country images"
  on public.country_images
  for select
  using (true);

-- Only the admin account can add/replace/remove photos (same rule as
-- admin_panel_policies.sql). Replace <ADMIN_EMAIL> with the admin account's
-- email before running; it is deliberately not committed to this public repo.
drop policy if exists "Admin can write country images" on public.country_images;
create policy "Admin can write country images"
  on public.country_images
  for all
  using (auth.jwt() ->> 'email' = '<ADMIN_EMAIL>')
  with check (auth.jwt() ->> 'email' = '<ADMIN_EMAIL>');
