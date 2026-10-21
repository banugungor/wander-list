-- Coordinates for Rome's and Vatican City's landmarks (46 rows), the pilot for
-- the trip map (components/trip-map.tsx). Run in the Supabase SQL Editor
-- after the lat/lng columns exist (end of landmarks_schema.sql).
--
-- Source: Wikidata property P625 (coordinate location), which is CC0 — no
-- attribution needed. The last column is the Wikidata item, so a value can be
-- re-checked. Ostia Antica (Q4994918) and the Appian Way (a road — the
-- coordinate is one point along it) are approximate; Ostia lies outside the
-- Rome base map on purpose and is simply not drawn.
--
-- Idempotent, matched by (country_id, name) like the other landmark scripts
-- (no row ids, which are not stable across environments). Only fills rows
-- that match; it never inserts. Re-run after adding more rows to the list.
-- Afterwards `select count(*) from landmarks where lat is not null` should
-- include these 46.
update public.landmarks as l
set lat = v.lat, lng = v.lng
from (values
  ('380', 'Colosseum', 41.890278, 12.492222, 'Q10285'),
  ('380', 'Trevi Fountain', 41.900932, 12.483313, 'Q185382'),
  ('380', 'Pantheon', 41.898611, 12.476944, 'Q99309'),
  ('336', 'St. Peter''s Basilica', 41.902222, 12.453417, 'Q12512'),
  ('336', 'Sistine Chapel', 41.903056, 12.454444, 'Q2943'),
  ('380', 'Roman Forum', 41.8922, 12.4852, 'Q180212'),
  ('380', 'Spanish Steps', 41.90611, 12.48278, 'Q848072'),
  ('380', 'Piazza Navona', 41.89871, 12.47316, 'Q463400'),
  ('380', 'Castel Sant''Angelo', 41.903044, 12.466307, 'Q486382'),
  ('380', 'Appian Way', 41.841389, 12.5325, 'Q189417'),
  ('380', 'Vittoriano (Altare della Patria)', 41.894722, 12.483056, 'Q506234'),
  ('380', 'Capitoline Museums', 41.893056, 12.482778, 'Q333906'),
  ('380', 'Trastevere', 41.887222, 12.465556, 'Q914255'),
  ('380', 'Borghese Gallery', 41.91421, 12.492144, 'Q841506'),
  ('380', 'Villa Borghese Gardens', 41.913647, 12.485104, 'Q678313'),
  ('380', 'Baths of Caracalla', 41.880264, 12.492764, 'Q502098'),
  ('380', 'Palatine Hill', 41.888333, 12.486944, 'Q200642'),
  ('380', 'Mouth of Truth', 41.888056, 12.481667, 'Q729490'),
  ('380', 'Basilica of St. John Lateran', 41.885906, 12.506156, 'Q84090'),
  ('380', 'Aventine Keyhole', 41.88293, 12.47841, 'Q123752976'),
  ('380', 'Catacombs of San Callixtus', 41.858878, 12.511058, 'Q1027069'),
  ('380', 'Ostia Antica', 41.76, 12.3, 'Q4994918'),
  ('336', 'Vatican Museums', 41.906389, 12.454444, 'Q182955'),
  ('336', 'St. Peter''s Square', 41.902183, 12.457239, 'Q83425'),
  ('336', 'Raphael Rooms', 41.903611, 12.456389, 'Q249449'),
  ('336', 'Vatican Gardens', 41.903056, 12.450556, 'Q42003'),
  ('336', 'Gallery of Maps', 41.904167, 12.454722, 'Q634691'),
  ('336', 'Vatican Pinacoteca', 41.90573, 12.45277, 'Q774940'),
  ('336', 'Bramante Staircase', 41.9064, 12.4544, 'Q3057821'),
  ('380', 'Basilica of Santa Maria Maggiore', 41.8975, 12.498611, 'Q186282'),
  ('380', 'Campo de'' Fiori', 41.895664, 12.472047, 'Q28303'),
  ('380', 'Piazza del Popolo', 41.910714, 12.476317, 'Q824997'),
  ('380', 'Pincio Terrace', 41.911763, 12.479653, 'Q550215'),
  ('380', 'Janiculum Hill', 41.891667, 12.461111, 'Q303001'),
  ('380', 'Santa Maria in Trastevere', 41.889444, 12.469722, 'Q1137391'),
  ('380', 'Basilica of San Clemente', 41.889295, 12.497563, 'Q385910'),
  ('380', 'Trajan''s Column', 41.895833, 12.484167, 'Q192784'),
  ('380', 'Capuchin Crypt', 41.904639, 12.488667, 'Q5037115'),
  ('380', 'Circus Maximus', 41.8859, 12.4857, 'Q207808'),
  ('380', 'Domus Aurea', 41.891389, 12.495278, 'Q622438'),
  ('380', 'Basilica of St. Paul Outside the Walls', 41.858611, 12.477222, 'Q231699'),
  ('380', 'Ara Pacis', 41.906389, 12.475556, 'Q623612'),
  ('380', 'Tiber Island', 41.890833, 12.477222, 'Q545404'),
  ('336', 'St. Peter''s Dome', 41.902429, 12.453282, 'Q3699559'),
  ('336', 'Vatican Necropolis (Scavi)', 41.902301, 12.453293, 'Q2119637'),
  ('336', 'Pio-Clementine Museum', 41.906731, 12.453515, 'Q1439912')
) as v(country_id, name, lat, lng, wikidata)
where l.country_id = v.country_id
  and l.name = v.name;
