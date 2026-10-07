-- Run this in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every insert is `on conflict ... do nothing`, so it only
-- ever adds what's missing — it never edits or deletes existing rows (e.g.
-- the Budapest "Parliament Building" row added from the admin panel keeps
-- its own longer description and photo).
--
-- Adds 98 landmarks (plus any missing cities), and a matching
-- "Yeni eklenenler" (catalog_highlights) row for each. Photos are left
-- empty on purpose — upload them later from the admin panel, then sync the
-- highlight cards with the snippet at the bottom of this file.
--
-- To add more landmarks later, append rows to the `_new_landmarks` values
-- list below (keep `ord` increasing) and re-run the whole file.
-- `country_id` is the `id` from data/worldCountries.json, not a name lookup,
-- because `countries` (countries_schema.sql) predates Antarctica/N. Cyprus.

begin;

-- 1) catalog_highlights.type originally didn't allow 'landmarks', so the
--    admin panel's "Yeni eklenenler" checkbox has been failing silently for
--    landmarks. Replace whatever check constraint is on that column.
do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'public.catalog_highlights'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table public.catalog_highlights drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.catalog_highlights
  add constraint catalog_highlights_type_check
  check (type in ('heritage', 'places', 'landmarks', 'cuisine', 'islands', 'capitals'));

-- 2) The list itself.
create temp table _new_landmarks (
  ord int not null,
  country_id text not null,
  city text not null,
  city_tr text,
  name text not null,
  name_tr text,
  description text,
  description_tr text,
  country text,
  country_tr text
) on commit drop;

insert into _new_landmarks
  (ord, country_id, city, city_tr, name, name_tr, description, description_tr, country, country_tr)
values
  (1, '792', 'Istanbul', 'İstanbul', 'Hagia Sophia', 'Ayasofya', 'A historic structure carrying the legacy of two millennia-old civilizations.', 'Bin yıllık iki medeniyetin izini taşıyan tarihi yapı.', 'Turkey', 'Türkiye'),
  (2, '792', 'Istanbul', 'İstanbul', 'Topkapi Palace', 'Topkapı Sarayı', 'The palace where Ottoman sultans lived for centuries.', 'Osmanlı padişahlarının yüzyıllar boyunca yaşadığı saray.', 'Turkey', 'Türkiye'),
  (3, '792', 'Nevsehir', 'Nevşehir', 'Cappadocia Balloon Tour', 'Kapadokya Balon Turu', 'An unforgettable sunrise over the fairy chimneys.', 'Peri bacalarının üzerinde unutulmaz bir gün doğumu.', 'Turkey', 'Türkiye'),
  (4, '792', 'Denizli', 'Denizli', 'Pamukkale Travertines', 'Pamukkale Travertenleri', 'Thermal pools set into snow-white limestone terraces.', 'Bembeyaz kireç taraçalarında sıcak su havuzları.', 'Turkey', 'Türkiye'),
  (5, '792', 'Antalya', 'Antalya', 'Duden Waterfalls', 'Düden Şelalesi', 'A dramatic waterfall that cascades straight into the sea.', 'Denize dökülen etkileyici bir şelale manzarası.', 'Turkey', 'Türkiye'),
  (6, '792', 'Izmir', 'İzmir', 'Ephesus Ancient City', 'Efes Antik Kenti', 'One of the best-preserved cities of the ancient world.', 'Antik dünyanın en iyi korunmuş kentlerinden biri.', 'Turkey', 'Türkiye'),
  (7, '792', 'Mardin', 'Mardin', 'Mardin Stone Houses', 'Mardin Taş Evleri', 'Historic stone streets overlooking the Mesopotamian plain.', 'Mezopotamya ovasına bakan tarihi taş sokaklar.', 'Turkey', 'Türkiye'),
  (8, '792', 'Trabzon', 'Trabzon', 'Sumela Monastery', 'Sümela Manastırı', 'A monastery carved into cliffs, often wrapped in mist.', 'Kayalıklara oyulmuş, sisler içinde bir manastır.', 'Turkey', 'Türkiye'),
  (9, '792', 'Mugla', 'Muğla', 'Bodrum Castle', 'Bodrum Kalesi', 'A crusader-era castle overlooking the Aegean Sea.', 'Ege''ye nazır, şövalyelerden kalma tarihi kale.', 'Turkey', 'Türkiye'),
  (10, '792', 'Fethiye', 'Fethiye', 'Oludeniz', 'Ölüdeniz', 'A turquoise lagoon famous for paragliding.', 'Turkuaz lagünü ve yamaç paraşütü cenneti.', 'Turkey', 'Türkiye'),
  (11, '792', 'Sanliurfa', 'Şanlıurfa', 'Gobekli Tepe', 'Göbeklitepe', 'The world''s oldest known site of ritual worship.', 'Dünyanın bilinen en eski tapınma alanı.', 'Turkey', 'Türkiye'),
  (12, '792', 'Konya', 'Konya', 'Mevlana Museum', 'Mevlana Müzesi', 'Rumi''s tomb and the heart of the whirling dervish tradition.', 'Mevlana''nın türbesi ve semazen kültürünün merkezi.', 'Turkey', 'Türkiye'),
  (13, '792', 'Karabuk', 'Karabük', 'Safranbolu Ottoman Houses', 'Safranbolu Osmanlı Evleri', 'Wooden Ottoman houses that seem frozen in time.', 'Zamanda donmuş gibi duran ahşap Osmanlı evleri.', 'Turkey', 'Türkiye'),
  (14, '250', 'Paris', 'Paris', 'Eiffel Tower', 'Eyfel Kulesi', 'An iconic spot to watch the sunset over the city.', 'Şehrin üzerinde gün batımını izlemek için ikonik bir nokta.', 'France', 'Fransa'),
  (15, '250', 'Paris', 'Paris', 'Louvre Museum', 'Louvre Müzesi', 'The world''s largest museum, home to the Mona Lisa.', 'Mona Lisa''nın da bulunduğu dünyanın en büyük müzesi.', 'France', 'Fransa'),
  (16, '250', 'Provence', 'Provence', 'Lavender Fields', 'Lavanta Tarlaları', 'A mesmerizing landscape of endless purple lavender.', 'Mor lavanta tarlalarının uzandığı büyüleyici manzara.', 'France', 'Fransa'),
  (17, '380', 'Rome', 'Roma', 'Colosseum', 'Kolezyum', 'Walk among the stones of a 2,000-year-old arena.', '2000 yıllık dev arenanın taşlarında yürü.', 'Italy', 'İtalya'),
  (18, '380', 'Venice', 'Venedik', 'Venice Canals', 'Venedik Kanalları', 'A romantic water city best explored by gondola.', 'Gondollarla dolaşılan romantik su şehri.', 'Italy', 'İtalya'),
  (19, '380', 'Florence', 'Floransa', 'Florence Cathedral (Duomo)', 'Floransa Katedrali', 'One of the most magnificent examples of Renaissance architecture.', 'Rönesans mimarisinin en görkemli örneklerinden biri.', 'Italy', 'İtalya'),
  (20, '380', 'Cinque Terre', 'Cinque Terre', 'Cinque Terre Villages', 'Cinque Terre Köyleri', 'Colorful fishing villages clinging to cliffside terraces.', 'Kayalıklara asılı renkli balıkçı köyleri.', 'Italy', 'İtalya'),
  (21, '724', 'Barcelona', 'Barselona', 'Sagrada Familia', 'Sagrada Familia', 'Gaudi''s still-unfinished masterpiece, over a century in the making.', 'Gaudí''nin yüz yılı aşkın süredir tamamlanmayan başyapıtı.', 'Spain', 'İspanya'),
  (22, '724', 'Granada', 'Granada', 'Alhambra Palace', 'Elhamra Sarayı', 'A palace-fortress showcasing the finest Andalusian architecture.', 'Endülüs mimarisinin en zarif örneği bir saray-kale.', 'Spain', 'İspanya'),
  (23, '724', 'Seville', 'Sevilla', 'Plaza de España', 'İspanya Meydanı', 'A grand semicircular plaza rich in historic detail.', 'Yarım daire şeklindeki devasa tarihi meydan.', 'Spain', 'İspanya'),
  (24, '620', 'Lisbon', 'Lizbon', 'Belem Tower', 'Belém Kulesi', 'A riverside tower symbolizing the Age of Discovery.', 'Büyük keşiflerin sembolü olan nehir kıyısı kulesi.', 'Portugal', 'Portekiz'),
  (25, '620', 'Porto', 'Porto', 'Dom Luis Bridge', 'Dom Luís Köprüsü', 'An iconic iron bridge spanning the Douro River.', 'Douro Nehri üzerinde ikonik demir köprü.', 'Portugal', 'Portekiz'),
  (26, '300', 'Santorini', 'Santorini', 'Oia', 'Oia', 'A sunset village famous for its white houses and blue domes.', 'Beyaz evleri ve mavi kubbeleriyle ünlü gün batımı köyü.', 'Greece', 'Yunanistan'),
  (27, '300', 'Athens', 'Atina', 'Acropolis', 'Akropolis', 'A temple complex at the height of ancient Greek civilization.', 'Antik Yunan uygarlığının zirvesindeki tapınak kompleksi.', 'Greece', 'Yunanistan'),
  (28, '826', 'London', 'Londra', 'Big Ben', 'Big Ben', 'The historic clock tower that has become a symbol of London.', 'Londra''nın simgesi haline gelen tarihi saat kulesi.', 'United Kingdom', 'İngiltere'),
  (29, '826', 'London', 'Londra', 'Tower Bridge', 'Tower Köprüsü', 'An iconic bascule bridge spanning the River Thames.', 'Thames Nehri üzerinde açılır kapanır ikonik köprü.', 'United Kingdom', 'İngiltere'),
  (30, '826', 'Edinburgh', 'Edinburgh', 'Edinburgh Castle', 'Edinburgh Kalesi', 'A historic castle perched atop an extinct volcano.', 'Sönmüş bir yanardağın üzerinde yükselen tarihi kale.', 'Scotland', 'İskoçya'),
  (31, '276', 'Bavaria', 'Bavyera', 'Neuschwanstein Castle', 'Neuschwanstein Şatosu', 'A fairytale castle said to have inspired Disney''s designs.', 'Masalsı görünümüyle Disney şatolarına ilham veren yapı.', 'Germany', 'Almanya'),
  (32, '276', 'Berlin', 'Berlin', 'Brandenburg Gate', 'Brandenburg Kapısı', 'A historic gate symbolizing Germany''s reunification.', 'Almanya''nın birliğinin sembolü olan tarihi kapı.', 'Germany', 'Almanya'),
  (33, '528', 'Amsterdam', 'Amsterdam', 'Amsterdam Canals', 'Amsterdam Kanalları', 'Historic waterways best explored by bike or boat.', 'Bisikletle ya da teknede keşfedilen tarihi su yolları.', 'Netherlands', 'Hollanda'),
  (34, '056', 'Brussels', 'Brüksel', 'Grand Place', 'Grand Place', 'A historic city square famed for its gilded facades.', 'Altın yaldızlı cepheleriyle ünlü tarihi kent meydanı.', 'Belgium', 'Belçika'),
  (35, '756', 'Zermatt', 'Zermatt', 'Matterhorn', 'Matterhorn', 'The Alps'' most iconic pyramid-shaped peak.', 'Alplerin en tanınmış piramit şeklindeki zirvesi.', 'Switzerland', 'İsviçre'),
  (36, '040', 'Vienna', 'Viyana', 'Schonbrunn Palace', 'Schönbrunn Sarayı', 'The Habsburg dynasty''s grand summer palace.', 'Habsburg hanedanının görkemli yazlık sarayı.', 'Austria', 'Avusturya'),
  (37, '203', 'Prague', 'Prag', 'Charles Bridge', 'Charles Köprüsü', 'A historic stone bridge lined with statues.', 'Heykellerle süslü, tarihi taş köprü.', 'Czech Republic', 'Çek Cumhuriyeti'),
  (38, '348', 'Budapest', 'Budapeşte', 'Parliament Building', 'Parlamento Binası', 'A gothic landmark glowing along the banks of the Danube.', 'Tuna Nehri kıyısında ışıklarla yıkanan gotik yapı.', 'Hungary', 'Macaristan'),
  (39, '191', 'Dubrovnik', 'Dubrovnik', 'Dubrovnik City Walls', 'Dubrovnik Surları', 'A medieval walk atop walls overlooking the Adriatic.', 'Adriyatik''e bakan ortaçağ surları üzerinde yürüyüş.', 'Croatia', 'Hırvatistan'),
  (40, '578', 'Lofoten', 'Lofoten', 'Lofoten Islands', 'Lofoten Adaları', 'Dramatic fjord scenery where steep mountains meet the sea.', 'Dik dağların denize döküldüğü dramatik fiyort manzarası.', 'Norway', 'Norveç'),
  (41, '578', 'Geiranger', 'Geiranger', 'Geirangerfjord', 'Geiranger Fiyordu', 'One of the most spectacular UNESCO-protected fjords.', 'UNESCO korumasındaki en etkileyici fiyordlardan biri.', 'Norway', 'Norveç'),
  (42, '352', 'Reykjavik', 'Reykjavik', 'Northern Lights', 'Kuzey Işıkları', 'A dancing green light show across the night sky.', 'Gece gökyüzünde dans eden yeşil ışık gösterisi.', 'Iceland', 'İzlanda'),
  (43, '643', 'Moscow', 'Moskova', 'Red Square', 'Kızıl Meydan', 'A historic square home to the Kremlin and St. Basil''s Cathedral.', 'Kremlin ve Aziz Basil Katedrali''nin bulunduğu tarihi meydan.', 'Russia', 'Rusya'),
  (44, '616', 'Krakow', 'Krakow', 'Wawel Castle', 'Wawel Kalesi', 'The historic residence of Polish kings.', 'Polonya krallarının tarihi ikametgahı.', 'Poland', 'Polonya'),
  (45, '752', 'Stockholm', 'Stockholm', 'Gamla Stan (Old Town)', 'Gamla Stan', 'A medieval old town with narrow streets and colorful facades.', 'Renkli cepheli dar sokaklarıyla ortaçağ eski şehri.', 'Sweden', 'İsveç'),
  (46, '208', 'Copenhagen', 'Kopenhag', 'The Little Mermaid Statue', 'Küçük Deniz Kızı Heykeli', 'A harborside statue inspired by Andersen''s fairy tale.', 'Andersen masalından esinlenen liman kenarı heykeli.', 'Denmark', 'Danimarka'),
  (47, '246', 'Lapland', 'Laponya', 'Snow Hotel', 'Kar Otel', 'A magical stay built entirely from snow and ice.', 'Tamamen buz ve kardan inşa edilmiş büyülü bir konaklama.', 'Finland', 'Finlandiya'),
  (48, '470', 'Valletta', 'Valletta', 'Valletta Old Town', 'Valletta Eski Şehir', 'A capital city ringed by fortifications built by the Knights.', 'Şövalyelerden kalma tahkimatlarla çevrili başkent.', 'Malta', 'Malta'),
  (49, 'zz-n-cyprus', 'Kyrenia', 'Girne', 'Kyrenia Castle', 'Girne Kalesi', 'A historic Ottoman-era castle rising above the harbor.', 'Liman kıyısında yükselen tarihi Osmanlı kalesi.', 'Cyprus', 'Kıbrıs'),
  (50, '268', 'Tbilisi', 'Tiflis', 'Old Tbilisi', 'Eski Tiflis', 'A historic center known for its sulfur baths and winding streets.', 'Kükürtlü hamamları ve dar sokaklarıyla tarihi merkez.', 'Georgia', 'Gürcistan'),
  (51, '031', 'Baku', 'Bakü', 'Flame Towers', 'Alev Kuleleri', 'Modern skyscrapers illuminated like flames at night.', 'Geceleri alev gibi ışıklandırılan modern gökdelenler.', 'Azerbaijan', 'Azerbaycan'),
  (52, '400', 'Ma''an', 'Ma''an', 'Petra', 'Petra', 'A canyon walk leading to a lost city carved into rose-red rock.', 'Kızıl kayalara oyulmuş kayıp şehre kanyondan yürüyüş.', 'Jordan', 'Ürdün'),
  (53, '818', 'Giza', 'Giza', 'Pyramids of Giza', 'Giza Piramitleri', 'The last surviving wonder of the ancient world.', 'Antik dünyanın son ayakta kalan yedi harikasından biri.', 'Egypt', 'Mısır'),
  (54, '504', 'Marrakech', 'Marakeş', 'Jemaa el-Fnaa Square', 'Jemaa el-Fna Meydanı', 'A square alive with night markets, storytellers, and musicians.', 'Gece hayatı, pazarcılar ve müzisyenlerle dolu meydan.', 'Morocco', 'Fas'),
  (55, '784', 'Dubai', 'Dubai', 'Burj Khalifa', 'Burj Khalifa', 'Take in the city view from the world''s tallest building.', 'Dünyanın en yüksek binasından şehri seyret.', 'UAE', 'BAE'),
  (56, '512', 'Muscat', 'Maskat', 'Sultan Qaboos Grand Mosque', 'Sultan Kabus Camii', 'Oman''s grandest mosque, admired for its elegant architecture.', 'Zarif mimarisiyle Umman''ın en görkemli camisi.', 'Oman', 'Umman'),
  (57, '634', 'Doha', 'Doha', 'Souq Waqif', 'Souq Waqif', 'A traditional market filled with spices and handicrafts.', 'Baharat ve el sanatlarıyla dolu geleneksel çarşı.', 'Qatar', 'Katar'),
  (58, '376', 'Jerusalem', 'Kudüs', 'Western Wall', 'Ağlama Duvarı', 'The heart of a city held sacred by three major religions.', 'Üç semavi dinin de kutsal saydığı tarihi şehrin kalbi.', 'Israel', 'İsrail'),
  (59, '404', 'Masai Mara', 'Masai Mara', 'Masai Mara Safari', 'Masai Mara Safari', 'A legendary safari ground for close encounters with lions and elephants.', 'Aslan ve fillerle yüz yüze gelinen efsanevi safari alanı.', 'Kenya', 'Kenya'),
  (60, '834', 'Serengeti', 'Serengeti', 'Great Migration', 'Büyük Göç', 'A natural wonder as millions of animals migrate across the plains.', 'Milyonlarca hayvanın yer değiştirdiği doğa mucizesi.', 'Tanzania', 'Tanzanya'),
  (61, '710', 'Cape Town', 'Cape Town', 'Table Mountain', 'Table Mountain', 'A flat-topped mountain overlooking both city and ocean.', 'Şehir ve okyanusu birden gören düz tepeli dağ.', 'South Africa', 'Güney Afrika'),
  (62, '894', 'Livingstone', 'Livingstone', 'Victoria Falls', 'Victoria Şelalesi', 'The thundering roar of the world''s largest waterfall.', 'Dünyanın en büyük şelalesinin gürleyen sesi.', 'Zambia', 'Zambiya'),
  (63, '072', 'Okavango', 'Okavango', 'Okavango Delta', 'Okavango Deltası', 'A wildlife-rich water maze best explored by canoe.', 'Kayıkla gezilen, vahşi yaşamla dolu su labirenti.', 'Botswana', 'Botsvana'),
  (64, '516', 'Namib Desert', 'Namib Çölü', 'Namib Desert Dunes', 'Namib Kum Tepeleri', 'Sunrise over some of the tallest sand dunes on Earth.', 'Dünyanın en yüksek kum tepelerinden gün doğumu.', 'Namibia', 'Namibya'),
  (65, '392', 'Kyoto', 'Kyoto', 'Fushimi Inari Shrine', 'Fushimi Inari Tapınağı', 'A hiking trail winding through thousands of orange torii gates.', 'Binlerce turuncu torii kapısından uzanan yürüyüş yolu.', 'Japan', 'Japonya'),
  (66, '392', 'Tokyo', 'Tokyo', 'Shibuya Crossing', 'Shibuya Kavşağı', 'Feel the city''s energy at the world''s busiest pedestrian crossing.', 'Dünyanın en yoğun yaya geçidinde şehir enerjisini hisset.', 'Japan', 'Japonya'),
  (67, '392', 'Honshu', 'Honshu', 'Mount Fuji', 'Fuji Dağı', 'Japan''s sacred and iconic peak.', 'Japonya''nın kutsal ve simgesel zirvesi.', 'Japan', 'Japonya'),
  (68, '156', 'Beijing', 'Pekin', 'Great Wall of China', 'Çin Seddi', 'A historic wall stretching thousands of kilometers across mountain ridges.', 'Dağların sırtında binlerce kilometre uzanan tarihi sur.', 'China', 'Çin'),
  (69, '156', 'Shanghai', 'Şanghay', 'The Bund', 'Bund', 'A riverside promenade where historic and modern skylines meet.', 'Nehir kıyısında tarihi ve modern silüetlerin buluştuğu yer.', 'China', 'Çin'),
  (70, '356', 'Agra', 'Agra', 'Taj Mahal', 'Tac Mahal', 'Watch a marble monument to love glow at sunrise.', 'Aşkın mermerden anıtını gün doğumunda izle.', 'India', 'Hindistan'),
  (71, '356', 'Jaipur', 'Jaipur', 'Amber Fort', 'Amber Kalesi', 'A grand hilltop fort in warm shades of amber and pink.', 'Tepede yükselen görkemli sarı-pembe kale.', 'India', 'Hindistan'),
  (72, '524', 'Kathmandu', 'Kathmandu', 'Everest Base Camp', 'Everest Base Kampı', 'A legendary trek to the foot of the world''s highest mountain.', 'Dünyanın en yüksek dağının eteğine yapılan efsanevi trek.', 'Nepal', 'Nepal'),
  (73, '144', 'Sigiriya', 'Sigiriya', 'Sigiriya Rock', 'Sigiriya Kayası', 'A massive rock crowned with the ruins of an ancient fortress.', 'Antik bir kale kalıntısını taşıyan devasa kaya.', 'Sri Lanka', 'Sri Lanka'),
  (74, '360', 'Ubud', 'Ubud', 'Tegallalang Rice Terraces', 'Tegallalang Pirinç Terasları', 'Terraces displaying countless shades of green.', 'Yeşilin binlerce tonunun bir arada göründüğü teraslar.', 'Indonesia', 'Endonezya'),
  (75, '764', 'Bangkok', 'Bangkok', 'Wat Arun Temple', 'Wat Arun Tapınağı', 'The riverside ''Temple of Dawn''.', 'Nehir kıyısında yükselen ''Şafak Tapınağı''.', 'Thailand', 'Tayland'),
  (76, '704', 'Ha Long', 'Ha Long', 'Ha Long Bay', 'Ha Long Körfezi', 'Emerald waters dotted with thousands of limestone islands.', 'Binlerce kireçtaşı adasıyla dolu zümrüt sular.', 'Vietnam', 'Vietnam'),
  (77, '116', 'Siem Reap', 'Siem Reap', 'Angkor Wat', 'Angkor Wat', 'The world''s largest religious monument, magical at sunrise.', 'Dünyanın en büyük dini anıtı, gün doğumunda büyülü.', 'Cambodia', 'Kamboçya'),
  (78, '410', 'Seoul', 'Seul', 'Gyeongbokgung Palace', 'Gyeongbokgung Sarayı', 'The main royal palace of the Joseon dynasty.', 'Joseon hanedanının başkent sarayı.', 'South Korea', 'Güney Kore'),
  (79, '462', 'Male', 'Malé', 'Maldives Underwater World', 'Maldivler Sualtı Dünyası', 'Coral reefs and colorful fish in crystal-clear turquoise water.', 'Berrak turkuaz sularda mercan resifleri ve renkli balıklar.', 'Maldives', 'Maldivler'),
  (80, '702', 'Singapore', 'Singapur', 'Marina Bay Sands', 'Marina Bay Sands', 'An iconic skyscraper complex famous for its rooftop pool.', 'Çatı havuzuyla ünlü ikonik gökdelen kompleksi.', 'Singapore', 'Singapur'),
  (81, '458', 'Kuala Lumpur', 'Kuala Lumpur', 'Petronas Towers', 'Petronas Kuleleri', 'Once the tallest twin towers in the world.', 'Bir zamanlar dünyanın en yüksek ikiz kuleleri.', 'Malaysia', 'Malezya'),
  (82, '608', 'Palawan', 'Palawan', 'El Nido', 'El Nido', 'Turquoise lagoons framed by dramatic limestone cliffs.', 'Kireçtaşı kayalıklarla çevrili masmavi lagünler.', 'Philippines', 'Filipinler'),
  (83, '036', 'Sydney', 'Sidney', 'Sydney Opera House', 'Sydney Opera Binası', 'A sail-shaped landmark rising above the harbor.', 'Limanın üzerinde yükselen beyaz yelken formundaki yapı.', 'Australia', 'Avustralya'),
  (84, '036', 'Queensland', 'Queensland', 'Great Barrier Reef', 'Büyük Set Resifi', 'The world''s largest coral reef system.', 'Dünyanın en büyük mercan resif sistemi.', 'Australia', 'Avustralya'),
  (85, '554', 'Milford Sound', 'Milford Sound', 'Milford Sound', 'Milford Sound Fiyordu', 'A dramatic fjord ringed by waterfalls and rainforest.', 'Şelaleler ve yağmur ormanlarıyla çevrili dramatik fiyort.', 'New Zealand', 'Yeni Zelanda'),
  (86, '242', 'Fiji Islands', 'Fiji Adaları', 'Fiji Coral Islands', 'Fiji Mercan Adaları', 'Palm-fringed islets surrounded by clear coral waters.', 'Palmiye ağaçlı adacıklar ve berrak mercan sular.', 'Fiji', 'Fiji'),
  (87, '840', 'New York', 'New York', 'Statue of Liberty', 'Özgürlük Heykeli', 'The towering statue that symbolizes American freedom.', 'Amerika''nın özgürlük sembolü olan dev heykel.', 'USA', 'ABD'),
  (88, '840', 'Arizona', 'Arizona', 'Grand Canyon', 'Grand Canyon', 'Stand at the edge of one of Earth''s largest canyons.', 'Yeryüzünün en büyük kanyonunun kenarında dur.', 'USA', 'ABD'),
  (89, '840', 'San Francisco', 'San Francisco', 'Golden Gate Bridge', 'Golden Gate Köprüsü', 'A rust-orange bridge rising through the fog.', 'Sisler arasında yükselen kızıl-turuncu ikonik köprü.', 'USA', 'ABD'),
  (90, '840', 'Hawaii', 'Hawaii', 'Waikiki Beach', 'Waikiki Plajı', 'A tropical shoreline famous for surfing and sunsets.', 'Sörf ve gün batımıyla ünlü tropik sahil şeridi.', 'USA', 'ABD'),
  (91, '124', 'Ontario', 'Ontario', 'Niagara Falls', 'Niagara Şelaleleri', 'A thundering natural spectacle of cascading water.', 'Gürleyen suların yarattığı muhteşem doğa gösterisi.', 'Canada', 'Kanada'),
  (92, '484', 'Yucatan', 'Yucatan', 'Chichen Itza', 'Chichen Itza', 'A great step-pyramid temple left by the Maya civilization.', 'Maya uygarlığından kalma dev piramit tapınağı.', 'Mexico', 'Meksika'),
  (93, '604', 'Cusco', 'Cusco', 'Machu Picchu', 'Machu Picchu', 'A lost Inca city perched above the clouds.', 'Bulutların üzerindeki kayıp İnka şehri.', 'Peru', 'Peru'),
  (94, '076', 'Rio de Janeiro', 'Rio de Janeiro', 'Christ the Redeemer', 'Kurtarıcı İsa Heykeli', 'A colossal statue overlooking the city with open arms.', 'Şehri kollarını açarak izleyen devasa heykel.', 'Brazil', 'Brezilya'),
  (95, '032', 'Buenos Aires', 'Buenos Aires', 'La Boca (Tango Streets)', 'La Boca (Tango Sokakları)', 'A neighborhood famed for its colorful houses and street tango.', 'Renkli evleri ve sokak tangosuyla ünlü mahalle.', 'Argentina', 'Arjantin'),
  (96, '152', 'Atacama', 'Atacama', 'Atacama Desert', 'Atacama Çölü', 'Star-filled skies above the world''s driest desert.', 'Dünyanın en kurak çölünde yıldızlarla dolu gökyüzü.', 'Chile', 'Şili'),
  (97, '192', 'Havana', 'Havana', 'Old Havana', 'Eski Havana', 'Streets filled with vintage cars and colorful colonial buildings.', 'Klasik otomobiller ve renkli kolonyal binalarla dolu sokaklar.', 'Cuba', 'Küba'),
  (98, '010', 'Antarctic Peninsula', 'Antarktika Yarımadası', 'Glacier Landscapes', 'Buzul Manzaraları', 'An untouched world of penguins and towering glaciers.', 'Penguenler ve devasa buzullarla el değmemiş bir dünya.', 'Antarctica', 'Antarktika');

-- 3) Cities (reuses an existing city with the same English name).
insert into public.cities (country_id, name, name_tr)
select distinct on (country_id, city) country_id, city, city_tr
from _new_landmarks
order by country_id, city, ord
on conflict (country_id, name) do nothing;

-- 4) Landmarks. sort_order follows list order, so a city's landmarks show
--    in the order they're listed above.
insert into public.landmarks
  (country_id, city_id, name, name_tr, description, description_tr, sort_order)
select n.country_id, c.id, n.name, n.name_tr, n.description, n.description_tr, n.ord
from _new_landmarks n
join public.cities c on c.country_id = n.country_id and c.name = n.city
order by n.ord
on conflict (city_id, name) do nothing;

-- 5) "Yeni eklenenler" rows. created_at is staggered by list order (first
--    row = newest) so the home rail, which shows only the newest 20, has a
--    stable order instead of every row sharing one transaction timestamp.
insert into public.catalog_highlights
  (type, item_id, title, title_tr, subtitle, subtitle_tr, image_url, created_at)
select 'landmarks', l.id::text, l.name, l.name_tr, n.country, n.country_tr, l.image_url,
       now() - make_interval(secs => n.ord)
from _new_landmarks n
join public.cities c on c.country_id = n.country_id and c.name = n.city
join public.landmarks l on l.city_id = c.id and l.name = n.name
on conflict (type, item_id) do nothing;

commit;

-- After uploading photos from the admin panel, run this (on its own) to copy
-- each landmark's photo onto its "Yeni eklenenler" card — the panel's edit
-- form only updates `landmarks`, not `catalog_highlights`:
--
-- update public.catalog_highlights h
-- set image_url = l.image_url
-- from public.landmarks l
-- where h.type = 'landmarks'
--   and h.item_id = l.id::text
--   and h.image_url is distinct from l.image_url;
