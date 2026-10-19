-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.
--
-- User suggestions ("Öneri gönder"): a signed-in user proposes a landmark,
-- dish or island for a country, e.g. a local telling us about places in
-- Benin we don't know. Suggestions are NOT shown in the app — they land here
-- as 'pending' and the founder reviews them (admin panel's "Öneriler" tab),
-- then adds the good ones to landmarks / cuisine_meals / islands by hand.
-- Because nothing user-written is ever displayed to other users, the app
-- needs no report/block flow for this (App Store UGC rule 1.2).
--
-- Write-only for users: RLS lets an authenticated user INSERT their own row
-- and nothing else — nobody can read, edit or delete suggestions from the
-- app (not even their own). The admin account's read/update/delete policy
-- lives in admin_panel_policies.sql, like the other admin-writable tables.
--
-- Deleting an account deliberately does NOT delete its suggestions
-- (`on delete set null`): the user agreed at submit time that the
-- suggestion may be used by Wanderlist even if they later delete their
-- account (see suggest.consentDetail in constants/translations.ts), so the
-- row just loses its link to the person (user_id becomes null).
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  category text not null check (category in ('landmarks', 'cuisine', 'islands')),
  -- Matches the `id` field in data/worldCountries.json (e.g. "204" = Benin).
  country_id text not null,
  name text not null check (char_length(name) between 1 and 120),
  -- Landmarks: the city it's in. Cuisine: city/region the dish is from.
  -- Unused for islands.
  city text check (city is null or char_length(city) <= 120),
  description text check (description is null or char_length(description) <= 1000),
  -- Which version of the consent text the user ticked in the form
  -- (SUGGESTION_TERMS_VERSION in data/suggestions.ts), and when. Bump the
  -- version whenever the wording changes so old rows stay traceable.
  terms_version integer not null check (terms_version >= 1),
  terms_accepted_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists suggestions_status_created_idx
  on public.suggestions (status, created_at desc);

alter table public.suggestions enable row level security;

drop policy if exists "Users can submit suggestions" on public.suggestions;
create policy "Users can submit suggestions"
  on public.suggestions
  for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'pending');

-- Abuse guard (someone calling the API directly with the public anon key):
-- at most 10 suggestions per user per rolling 24 hours.
create or replace function public.suggestions_enforce_rate_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.suggestions
    where user_id = new.user_id
      and created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'suggestion limit reached';
  end if;
  return new;
end;
$$;

drop trigger if exists suggestions_enforce_rate_limit on public.suggestions;
create trigger suggestions_enforce_rate_limit
  before insert on public.suggestions
  for each row execute function public.suggestions_enforce_rate_limit();

-- ---------------------------------------------------------------------------
-- v2: one optional photo per suggestion + "heritage_photo" suggestions.
--
-- * image_path: object path in the private `suggestion-images` bucket
--   (suggestion_images_bucket.sql — run that too), always `<user_id>/<file>`.
--   Optional for landmarks/cuisine/islands, required for heritage_photo.
-- * heritage_photo: a user sends a photo for a UNESCO site that has none
--   (the list itself is bundled, so there's nothing else to suggest about
--   it). heritage_site_id is the bundled site's id (data/heritageSites.json),
--   `name` holds the site's English name so the admin panel can show it, and
--   country_id is unused (null).
-- Existing rows are untouched; every statement is safe to re-run.
alter table public.suggestions
  add column if not exists image_path text
    check (image_path is null or char_length(image_path) <= 200),
  add column if not exists heritage_site_id text
    check (heritage_site_id is null or char_length(heritage_site_id) <= 40);

alter table public.suggestions alter column country_id drop not null;

alter table public.suggestions drop constraint if exists suggestions_category_check;
alter table public.suggestions
  add constraint suggestions_category_check
  check (category in ('landmarks', 'cuisine', 'islands', 'heritage_photo'));

alter table public.suggestions drop constraint if exists suggestions_target_check;
alter table public.suggestions
  add constraint suggestions_target_check
  check (
    (category = 'heritage_photo' and heritage_site_id is not null and image_path is not null)
    or (category <> 'heritage_photo' and country_id is not null)
  );

-- Replaces the insert policy above: same rules, plus a photo path must live
-- in the sender's own folder of the bucket.
drop policy if exists "Users can submit suggestions" on public.suggestions;
create policy "Users can submit suggestions"
  on public.suggestions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and (image_path is null or image_path like auth.uid()::text || '/%')
  );

-- ---------------------------------------------------------------------------
-- v3: a photo for an entry that already exists but has none ("Fotoğraf ekle"
-- on a dish / island / landmark row without a photo).
--
-- Same category as a normal suggestion (landmarks / cuisine / islands), but
-- target_id is set to the existing row's id (cuisine_meals.id / islands.id /
-- landmarks.id, as text), `name` is that row's English name, country_id its
-- country, and the photo is required. Heritage keeps using heritage_photo.
alter table public.suggestions
  add column if not exists target_id text
    check (target_id is null or char_length(target_id) <= 40);

alter table public.suggestions drop constraint if exists suggestions_target_check;
alter table public.suggestions
  add constraint suggestions_target_check
  check (
    (category = 'heritage_photo' and heritage_site_id is not null and image_path is not null)
    or (
      category <> 'heritage_photo'
      and country_id is not null
      and (target_id is null or image_path is not null)
    )
  );

