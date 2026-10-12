-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.
--
-- Photo overrides for the UNESCO heritage list. The site list itself is NOT
-- in Supabase — it ships bundled with the app (data/heritageSites.json), so
-- there is no `heritage_sites` table to hang an image_url column on. This
-- table only maps a heritage site's id (the same uuid-ish `id` field in that
-- JSON) to a photo, added from the admin panel's "Miras" tab. The app reads
-- it at startup (data/heritageImages.ts) and overlays it on the bundled
-- list; a photo set here wins over any `imageUrl` baked into the JSON.
--
-- Photos are uploaded to the existing public `content-images` bucket (see
-- content_images_bucket.sql, which must have been run first).
create table if not exists public.heritage_images (
  -- No foreign key: the site list isn't a table. A typo'd id would just
  -- never match anything in the app.
  site_id text primary key,
  image_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.heritage_images enable row level security;

-- Readable by everyone, including signed-out users — same public photos the
-- app shows to every user.
drop policy if exists "Anyone can read heritage images" on public.heritage_images;
create policy "Anyone can read heritage images"
  on public.heritage_images
  for select
  using (true);

-- Only the admin account can add/replace/remove photos (same rule as
-- admin_panel_policies.sql). Replace <ADMIN_EMAIL> with the admin account's
-- email before running; it is deliberately not committed to this public repo.
drop policy if exists "Admin can write heritage images" on public.heritage_images;
create policy "Admin can write heritage images"
  on public.heritage_images
  for all
  using (auth.jwt() ->> 'email' = '<ADMIN_EMAIL>')
  with check (auth.jwt() ->> 'email' = '<ADMIN_EMAIL>');
