-- Run this once in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.

-- "What's new" feed for the home screen's "Son Eklenenler" rail. You add a
-- row here every time you add new content to any list (a new dish, a newly
-- launched category like Islands, etc.) so members see it was added and can
-- mark it right from the home screen. The app only ever reads this table —
-- writes happen from the Supabase dashboard (Table Editor), same as
-- cuisine_meals.
create table if not exists public.catalog_highlights (
  id bigint generated always as identity primary key,
  -- One of constants/categories.ts's CategoryId values.
  type text not null check (type in ('heritage', 'places', 'cuisine', 'islands', 'capitals')),
  -- The id of the underlying item within its own list — a heritage site id,
  -- a worldCountries.json country id, or a cuisine_meals row id (as text).
  item_id text not null,
  title text not null,
  title_tr text,
  subtitle text,
  subtitle_tr text,
  image_url text,
  -- For `type = 'places'` entries, so the card can fall back to the flag
  -- when there's no image_url (mirrors the rest of the app's country cards).
  iso2 text,
  created_at timestamptz not null default now()
);

create index if not exists catalog_highlights_created_at_idx
  on public.catalog_highlights (created_at desc);

alter table public.catalog_highlights enable row level security;

drop policy if exists "Anyone can read catalog highlights" on public.catalog_highlights;
create policy "Anyone can read catalog highlights"
  on public.catalog_highlights
  for select
  using (true);
