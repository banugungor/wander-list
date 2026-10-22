-- Coordinates for Ljubljana's 11 landmarks, so a trip's stops there show on the
-- trip map (components/trip-map.tsx; the base map is scripts/city_maps/ljubljana.sql).
-- Run in the Supabase SQL Editor after the lat/lng columns exist (end of
-- landmarks_schema.sql).
--
-- Source: Wikidata property P625 (coordinate location), which is CC0 — no
-- attribution needed. The last column is the Wikidata item, so a value can be
-- re-checked. Two rows have no item of their own and use a nearby one:
-- "Ljubljana Old Town" uses Old Square (Stari trg, Q12803454), the old town's
-- heart; "Central Market" uses Plečnik's Marketplace (Q12034073).
--
-- Idempotent, matched by (country_id, name) like add_landmark_coords_rome.sql
-- (no row ids, which are not stable across environments). Only fills rows
-- that match; it never inserts. Afterwards
-- `select count(*) from landmarks where lat is not null and country_id = '705'`
-- should be 11.
update public.landmarks as l
set lat = v.lat, lng = v.lng
from (values
  ('705', 'Dragon Bridge', 46.051944, 14.510278, 'Q660029'),
  ('705', 'Preseren Square', 46.051366, 14.505953, 'Q1889515'),
  ('705', 'Central Market', 46.051432, 14.50857, 'Q12034073'),
  ('705', 'Ljubljana Cathedral', 46.050714, 14.508242, 'Q1236564'),
  ('705', 'Metelkova', 46.056389, 14.516667, 'Q1925231'),
  ('705', 'Ljubljana Old Town', 46.04752, 14.506301, 'Q12803454'),
  ('705', 'Ljubljana Castle', 46.048712, 14.508635, 'Q2075156'),
  ('705', 'Triple Bridge', 46.051082, 14.506205, 'Q676315'),
  ('705', 'National and University Library', 46.046944, 14.503889, 'Q1520466'),
  ('705', 'Cobblers'' Bridge', 46.048387, 14.505575, 'Q5138810'),
  ('705', 'Tivoli Park', 46.0539, 14.4967, 'Q2428528')
) as v(country_id, name, lat, lng, wikidata)
where l.country_id = v.country_id
  and l.name = v.name;
