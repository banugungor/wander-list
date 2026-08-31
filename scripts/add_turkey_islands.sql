-- Run this once in the Supabase SQL editor (Database > SQL Editor), after
-- islands_schema.sql has already been applied.
-- Safe to re-run: `on conflict (country_id, name) do nothing` means it only
-- ever ADDS missing rows here — it never touches or deletes islands that
-- already exist for Turkey (or any other country).
--
-- Looks up Turkey's id from the `countries` reference table (see
-- countries_schema.sql) instead of hardcoding "792", so a typo in the name
-- fails the lookup loudly instead of silently inserting under the wrong id.

insert into public.islands (country_id, name, name_tr, description, description_tr, sort_order)
values
  -- İstanbul (Adalar / Princes' Islands)
  ((select id from countries where name = 'Turkey'), 'Buyukada', 'Büyükada', 'The largest of Istanbul''s Princes'' Islands, in the Adalar district.', 'İstanbul''un Adalar ilçesindeki Prens Adaları''nın en büyüğü.', 10),
  ((select id from countries where name = 'Turkey'), 'Heybeliada', 'Heybeliada', 'The second-largest of Istanbul''s Princes'' Islands.', 'İstanbul''un Prens Adaları''ndan, ikinci büyük ada.', 11),
  ((select id from countries where name = 'Turkey'), 'Burgazada', 'Burgazada', 'One of Istanbul''s Princes'' Islands, in the Adalar district.', 'İstanbul''un Adalar ilçesindeki Prens Adaları''ndan biri.', 12),
  ((select id from countries where name = 'Turkey'), 'Kinaliada', 'Kınalıada', 'The Princes'' Island closest to Istanbul''s mainland.', 'İstanbul''un Prens Adaları''ndan, kıyıya en yakın olanı.', 13),
  ((select id from countries where name = 'Turkey'), 'Sedef Island', 'Sedef Adası', 'The smallest of Istanbul''s inhabited Princes'' Islands.', 'İstanbul''un Prens Adaları''ndan, yerleşim bulunan en küçüğü.', 14),

  -- Çanakkale
  ((select id from countries where name = 'Turkey'), 'Bozcaada', 'Bozcaada', 'An Aegean island off Çanakkale, known for its vineyards and beaches.', 'Çanakkale açıklarında, bağları ve plajlarıyla bilinen bir Ege adası.', 20),
  ((select id from countries where name = 'Turkey'), 'Gokceada', 'Gökçeada', 'The largest island in Turkey, off the Çanakkale coast.', 'Çanakkale kıyılarında, Türkiye''nin en büyük adası.', 21),

  -- Balıkesir
  ((select id from countries where name = 'Turkey'), 'Cunda (Alibey) Island', 'Cunda (Alibey) Adası', 'An Aegean island off Ayvalık, Balıkesir, connected by a causeway.', 'Balıkesir''in Ayvalık ilçesi açıklarında, yol bağlantısı olan bir Ege adası.', 30),
  ((select id from countries where name = 'Turkey'), 'Marmara Island', 'Marmara Adası', 'The largest island in the Sea of Marmara, part of Balıkesir province.', 'Marmara Denizi''ndeki en büyük ada, Balıkesir iline bağlıdır.', 31),
  ((select id from countries where name = 'Turkey'), 'Avsa Island', 'Avşa Adası', 'An island in the Sea of Marmara, part of Balıkesir province, known for its beaches.', 'Balıkesir iline bağlı, plajlarıyla bilinen bir Marmara Denizi adası.', 32),
  ((select id from countries where name = 'Turkey'), 'Pasalimani Island', 'Paşalimanı Adası', 'An island in the Sea of Marmara, part of Balıkesir province.', 'Balıkesir iline bağlı bir Marmara Denizi adası.', 33),

  -- İzmir
  ((select id from countries where name = 'Turkey'), 'Uzunada', 'Uzunada', 'An island off Urla, İzmir, in the Aegean Sea.', 'İzmir''in Urla ilçesi açıklarında bir Ege adası.', 40),

  -- Muğla
  ((select id from countries where name = 'Turkey'), 'Sedir Island (Cleopatra Island)', 'Sedir Adası (Kleopatra Adası)', 'An island near Marmaris, Muğla, known for its "Cleopatra Beach."', 'Muğla''nın Marmaris ilçesi yakınlarında, "Kleopatra Plajı" ile bilinen bir ada.', 50),
  ((select id from countries where name = 'Turkey'), 'Karaada', 'Karaada', 'An island off Bodrum, Muğla, known for its mud baths.', 'Muğla''nın Bodrum ilçesi açıklarında, çamur banyolarıyla bilinen bir ada.', 51),
  ((select id from countries where name = 'Turkey'), 'Orak Island', 'Orak Adası', 'An island off Bodrum, Muğla, popular for its bays.', 'Muğla''nın Bodrum ilçesi açıklarında, koylarıyla bilinen bir ada.', 52)
on conflict (country_id, name) do nothing;
