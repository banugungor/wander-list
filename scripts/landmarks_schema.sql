-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.

-- Cities are a real reference table (not a free-text column on landmarks)
-- so a city is a stable, typo-proof grouping key for the app's Country >
-- City > Landmark drill-down. Grown organically from the admin panel: pick
-- an existing city for the country, or add a new one once, rather than
-- retyping a name (and risking a duplicate group) every time.
create table if not exists public.cities (
  id bigint generated always as identity primary key,
  -- Matches the `id` field in data/worldCountries.json (e.g. "792" = Turkey),
  -- the same id the rest of the app already uses for countries.
  country_id text not null,
  name text not null,
  name_tr text,
  created_at timestamptz not null default now()
);

create index if not exists cities_country_id_idx
  on public.cities (country_id);

create unique index if not exists cities_country_name_uidx
  on public.cities (country_id, name);

alter table public.cities enable row level security;

drop policy if exists "Anyone can read cities" on public.cities;
create policy "Anyone can read cities"
  on public.cities
  for select
  using (true);

-- Master content table: you manage rows here (admin panel or SQL Editor),
-- the app only ever reads it. Upload landmark photos to Supabase Storage
-- (a public bucket) and paste the public URL into image_url.
create table if not exists public.landmarks (
  id bigint generated always as identity primary key,
  country_id text not null,
  city_id bigint not null references public.cities (id) on delete restrict,
  name text not null,
  name_tr text,
  description text,
  description_tr text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists landmarks_country_id_idx
  on public.landmarks (country_id);

create index if not exists landmarks_city_id_idx
  on public.landmarks (city_id);

-- Lets inserts use `on conflict (city_id, name) do nothing` so re-running
-- an insert script (e.g. pasting it into the SQL Editor twice by mistake)
-- doesn't create a second row for the same landmark.
create unique index if not exists landmarks_city_name_uidx
  on public.landmarks (city_id, name);

alter table public.landmarks enable row level security;

-- Readable by everyone, including signed-out users — this is shared content,
-- not per-user data. No insert/update/delete policy is defined, so writes
-- only happen from the Supabase dashboard or the admin panel (see
-- admin_panel_policies.sql), never from the app.
drop policy if exists "Anyone can read landmarks" on public.landmarks;
create policy "Anyone can read landmarks"
  on public.landmarks
  for select
  using (true);

-- Extends the user_backups table (see user_backups_schema.sql) with a slot
-- for the Landmarks feature's "visited" landmark ids. Landmarks is a
-- membership-gated category (see data/subscription.ts, same all-access
-- entitlement as Islands) — this column still syncs unconditionally, same
-- as every other visited list; gating only affects whether the app lets
-- the user reach the toggle UI.
alter table public.user_backups
  add column if not exists landmarks_visited jsonb not null default '[]';
