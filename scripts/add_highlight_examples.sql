-- Reusable copy-paste templates for adding a new "Son eklenenler" / "Yeni
-- eklenenler" entry from the Supabase SQL Editor. Not run automatically by
-- anything — these are examples to copy, edit the REPLACE_* placeholders,
-- and run by hand whenever new content ships.
--
-- Prerequisite: scripts/countries_schema.sql and
-- scripts/catalog_highlights_schema.sql must already be applied.

-- ============================================================
-- TEMPLATE 1: add a COUNTRY highlight (type = 'places')
-- ============================================================
-- For places, item_id IS the country's own id — no separate table to
-- insert into first, just look the id up by (English) name.

insert into public.catalog_highlights (type, item_id, title, title_tr, iso2)
select 'places', id, name, name_tr, iso2
from public.countries
where name = 'REPLACE_COUNTRY_NAME_IN_ENGLISH';
-- Example: where name = 'Japan';


-- ============================================================
-- TEMPLATE 2: add a DISH highlight (type = 'cuisine')
-- ============================================================
-- Cuisine is two steps in one statement: first create the dish row in
-- cuisine_meals (looking up its country by name so you never hand-type a
-- numeric country_id), then create the matching catalog_highlights row
-- using the id Postgres just generated — the two ids are guaranteed to
-- match, no copy-paste needed.

with country as (
  select id from public.countries where name = 'REPLACE_COUNTRY_NAME_IN_ENGLISH'
),
new_meal as (
  insert into public.cuisine_meals
    (country_id, name, name_tr, city, city_tr, description, description_tr, image_url)
  select
    country.id,
    'REPLACE_DISH_NAME_EN',
    'REPLACE_DISH_NAME_TR',
    'REPLACE_CITY_EN_OR_NULL',
    'REPLACE_CITY_TR_OR_NULL',
    'REPLACE_DESCRIPTION_EN_OR_NULL',
    'REPLACE_DESCRIPTION_TR_OR_NULL',
    'REPLACE_IMAGE_URL'
  from country
  returning id, name, name_tr, city, city_tr, image_url
)
insert into public.catalog_highlights
  (type, item_id, title, title_tr, subtitle, subtitle_tr, image_url)
select 'cuisine', id::text, name, name_tr, city, city_tr, image_url
from new_meal;
-- Example values: country name 'Turkey', dish 'Künefe'/'Künefe',
-- city 'Hatay'/'Hatay', image_url a public Supabase Storage link.
-- If city doesn't apply, use null instead of a quoted empty string.
