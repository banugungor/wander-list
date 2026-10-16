-- Run this in the Supabase SQL editor (Database > SQL Editor).
-- Safe to re-run: every insert is `on conflict ... do nothing`, so it only
-- ever adds what's missing — it never edits or deletes existing rows.
--
-- Hungary (country id '348'): 13 more dishes for `cuisine_meals` and 33 more
-- landmarks (plus any missing cities) for `landmarks`. Nothing here repeats
-- what the earlier files / the live tables already have for Hungary
-- (5 dishes; 11 landmarks in Budapest, Eger and Balaton).
-- Duplicates are skipped by the unique indexes: `cuisine_meals` on
-- (country_id, name), `cities` on (country_id, name), `landmarks` on
-- (city_id, name) — see cuisine_meals_schema.sql / landmarks_schema.sql, which
-- must have been run first. An exact name match under the SAME city/country
-- is skipped; the same place under a different spelling or city would NOT be,
-- so eyeball that before adding to this list.
-- City names are plain ASCII (Pecs, Heviz...) like the other landmark files;
-- the accented form goes in `city_tr`.
-- Does NOT create `catalog_highlights` ("Yeni eklenenler") rows. Photos are
-- left empty on purpose — upload them from the admin panel.
-- `ord` continues after add_landmarks_4.sql's last value (1957).

begin;

-- 1) Dishes -------------------------------------------------------------
insert into public.cuisine_meals
  (country_id, name, name_tr, city, city_tr, description, description_tr, image_url, sort_order)
values
('348', 'Főzelék', 'Fözelek', null, null, 'A thick vegetable stew, a staple of everyday home cooking.', 'Günlük ev yemeklerinin temeli olan koyu kıvamlı sebze yahnisi.', null, 6),
('348', 'Pörkölt', 'Perkölt', null, null, 'A rich, paprika-based meat stew, usually served with nokedli dumplings.', 'Genellikle nokedli hamur topları eşliğinde sunulan, kırmızı biberli yoğun et yahnisi.', null, 7),
('348', 'Töltött káposzta', 'Tölttöt Kapoşta', null, null, 'Cabbage leaves stuffed with minced meat and rice, simmered in a tangy sauce.', 'Kıyma ve pirinçle doldurulup ekşimsi sosta pişirilen lahana sarması.', null, 8),
('348', 'Kürtőskalács', 'Kürtöşkalaç', null, null, 'A sweet spiral pastry baked over embers, known as chimney cake.', 'Közde pişirilen, baca keki olarak bilinen tatlı spiral hamur işi.', null, 9),
('348', 'Túrós csusza', 'Turoş Çuşa', null, null, 'Pasta with cottage cheese, sour cream and crispy bacon.', 'Lor peyniri, ekşi krema ve çıtır pastırmayla yapılan makarna.', null, 10),
('348', 'Lecsó', 'Leço', null, null, 'A stew of peppers, tomatoes and onions, often cooked with sausage.', 'Biber, domates ve soğandan yapılan, çoğu zaman sucukla pişirilen yahni.', null, 11),
('348', 'Rakott krumpli', 'Rakott Krumpli', null, null, 'Layered potato bake with eggs, sausage and sour cream.', 'Yumurta, sosis ve ekşi kremayla katmanlanan fırın patates yemeği.', null, 12),
('348', 'Gundel palacsinta', 'Gundel Palaçinta', 'Budapest', 'Budapeşte', 'A crêpe filled with walnuts and rum, topped with chocolate sauce.', 'Cevizli ve romlu iç harçla doldurulup çikolata sosuyla servis edilen krep.', null, 13),
('348', 'Somlói galuska', 'Somloi Galuşka', null, null, 'A sponge cake dessert with chocolate, walnuts, rum and whipped cream.', 'Çikolata, ceviz, rom ve çırpılmış kremayla hazırlanan pandispanya tatlısı.', null, 14),
('348', 'Rétes', 'Reteş', null, null, 'Thin pastry rolled around fillings like apple or sour cherry, the Hungarian strudel.', 'Elma ya da vişne gibi iç harçların ince hamura sarılmasıyla yapılan Macar strudel''i.', null, 15),
('348', 'Meggyleves', 'Medyleveş', null, null, 'A chilled sour cherry soup served in summer.', 'Yazın soğuk servis edilen vişne çorbası.', null, 16),
('348', 'Tokaji Aszú', 'Tokay Asu', 'Tokaj', 'Tokaj', 'A sweet dessert wine from the Tokaj region, called the wine of kings.', 'Tokaj bölgesinden gelen, "şarapların kralı" olarak anılan tatlı şarap.', null, 17),
('348', 'Pálinka', 'Palinka', null, null, 'A strong traditional fruit brandy made from plums, apricots or pears.', 'Erik, kayısı veya armuttan yapılan geleneksel sert meyve rakısı.', null, 18)
on conflict (country_id, name) do nothing;

-- 2) Landmarks ----------------------------------------------------------
create temp table _new_landmarks (
  ord int not null,
  country_id text not null,
  city text not null,
  city_tr text,
  name text not null,
  name_tr text,
  description text,
  description_tr text
) on commit drop;

insert into _new_landmarks
  (ord, country_id, city, city_tr, name, name_tr, description, description_tr)
values
  (1958, '348', 'Budapest', 'Budapeşte', 'Great Market Hall', 'Büyük Çarşı Salonu', 'A vast 19th-century market hall full of paprika, sausages and local food.', 'Kırmızı toz biber, sucuk ve yerel lezzetlerle dolu devasa 19. yüzyıl çarşı salonu.'),
  (1959, '348', 'Budapest', 'Budapeşte', 'Margaret Island', 'Margit Adası', 'A green island park in the middle of the Danube.', 'Tuna''nın ortasında yeşil bir ada parkı.'),
  (1960, '348', 'Budapest', 'Budapeşte', 'Matthias Church', 'Matyas Kilisesi', 'A Gothic church with a colorful tiled roof on Castle Hill.', 'Kale Tepesi''nde renkli çatı kiremitleriyle dikkat çeken gotik kilise.'),
  (1961, '348', 'Budapest', 'Budapeşte', 'Hungarian State Opera House', 'Macar Devlet Operası', 'A neo-Renaissance opera house on Andrássy Avenue.', 'Andrássy Caddesi''nde yer alan neo-Rönesans opera binası.'),
  (1962, '348', 'Budapest', 'Budapeşte', 'Gellért Thermal Bath', 'Gellért Kaplıcası', 'An Art Nouveau thermal bath with a famous mosaic hall.', 'Meşhur mozaik salonuyla tanınan Art Nouveau kaplıca.'),
  (1963, '348', 'Budapest', 'Budapeşte', 'Szimpla Kert', 'Szimpla Kert', 'The original ruin bar, set in a former abandoned building.', 'Terk edilmiş eski bir binada açılan, ilk "ruin bar".'),
  (1964, '348', 'Budapest', 'Budapeşte', 'Dohány Street Synagogue', 'Dohány Sokağı Sinagogu', 'The largest synagogue in Europe.', 'Avrupa''nın en büyük sinagogu.'),
  (1965, '348', 'Budapest', 'Budapeşte', 'House of Terror', 'Terör Evi', 'A museum on Hungary''s fascist and communist regimes.', 'Macaristan''ın faşist ve komünist dönemlerini anlatan müze.'),
  (1966, '348', 'Budapest', 'Budapeşte', 'Vajdahunyad Castle', 'Vajdahunyad Kalesi', 'A castle complex in City Park mixing several architectural styles.', 'Şehir Parkı''nda birçok mimari üslubu bir arada barındıran kale kompleksi.'),
  (1967, '348', 'Budapest', 'Budapeşte', 'Andrássy Avenue', 'Andrássy Caddesi', 'A grand tree-lined boulevard of mansions and cafés.', 'Konaklar ve kafelerle dolu, ağaçlı görkemli bulvar.'),
  (1968, '348', 'Budapest', 'Budapeşte', 'Liberty Bridge', 'Özgürlük Köprüsü', 'A green iron bridge across the Danube.', 'Tuna üzerinde yeşil renkli demir köprü.'),
  (1969, '348', 'Budapest', 'Budapeşte', 'Gül Baba''s Tomb', 'Gül Baba Türbesi', 'An Ottoman dervish tomb, the northernmost Muslim pilgrimage site in Europe.', 'Avrupa''nın en kuzeyindeki Müslüman ziyaret yeri olan Osmanlı dönemi dervişi türbesi.'),
  (1970, '348', 'Budapest', 'Budapeşte', 'Rudas Thermal Bath', 'Rudas Hamamı', 'A 16th-century Ottoman bath under a domed hall.', 'Kubbeli salonuyla 16. yüzyıldan kalma Osmanlı hamamı.'),
  (1971, '348', 'Budapest', 'Budapeşte', 'Király Thermal Bath', 'Király Hamamı', 'An Ottoman-era bath from the 16th century.', '16. yüzyıldan kalma Osmanlı dönemi hamamı.'),
  (1972, '348', 'Esztergom', 'Estergon', 'Esztergom Basilica', 'Estergon Bazilikası', 'The largest church in Hungary, above the Danube.', 'Tuna kıyısında, Macaristan''ın en büyük kilisesi.'),
  (1973, '348', 'Visegrad', 'Vişegrad', 'Visegrád Citadel', 'Vişegrad Kalesi', 'A hilltop fortress overlooking the Danube Bend.', 'Tuna Dirseği''ne hâkim tepe üstü kale.'),
  (1974, '348', 'Szentendre', 'Szentendre', 'Szentendre Old Town', 'Szentendre Eski Şehir', 'A small art town of colorful baroque houses.', 'Renkli barok evleriyle küçük bir sanat kasabası.'),
  (1975, '348', 'Pecs', 'Peç', 'Pécs Cathedral', 'Peç Katedrali', 'A four-towered cathedral in southern Hungary.', 'Güney Macaristan''daki dört kuleli katedral.'),
  (1976, '348', 'Pecs', 'Peç', 'Mosque of Pasha Qasim', 'Gazi Kasım Paşa Camii', 'The Ottoman mosque in Pécs, now a Catholic church.', 'Peç''teki, bugün Katolik kilisesi olarak kullanılan Osmanlı camisi.'),
  (1977, '348', 'Pecs', 'Peç', 'Zsolnay Cultural Quarter', 'Zsolnay Kültür Mahallesi', 'A former porcelain factory turned arts district.', 'Eski bir porselen fabrikasından dönüştürülmüş sanat mahallesi.'),
  (1978, '348', 'Eger', 'Eger', 'Eger Minaret', 'Eger Minaresi', 'The northernmost Ottoman minaret in Europe.', 'Avrupa''nın en kuzeyindeki Osmanlı minaresi.'),
  (1979, '348', 'Eger', 'Eger', 'Valley of the Beautiful Women', 'Güzel Kadınlar Vadisi', 'A valley of wine cellars known for Egri Bikavér.', 'Egri Bikavér şarabıyla ünlü şarap mahzenleri vadisi.'),
  (1980, '348', 'Szigetvar', 'Sigetvar', 'Szigetvár Castle', 'Sigetvar Kalesi', 'The fortress where Suleiman the Magnificent''s last campaign ended in 1566.', 'Kanuni Sultan Süleyman''ın son seferinin sona erdiği, 1566''daki kale.'),
  (1981, '348', 'Szigetvar', 'Sigetvar', 'Turbék', 'Turbek Anıt Alanı', 'The memorial site linked to Suleiman''s death near Szigetvár.', 'Sigetvar yakınlarında, Kanuni''nin vefatıyla ilişkilendirilen anıt alanı.'),
  (1982, '348', 'Heviz', 'Hévíz', 'Lake Hévíz', 'Hévíz Gölü', 'The largest thermal lake in the world suitable for bathing.', 'Yüzmeye uygun dünyanın en büyük termal gölü.'),
  (1983, '348', 'Balaton', 'Balaton', 'Tihany Abbey', 'Tihany Manastırı', 'A Benedictine abbey on the Tihany Peninsula.', 'Tihany Yarımadası''ndaki Benedikten manastırı.'),
  (1984, '348', 'Szeged', 'Segedin', 'Votive Church', 'Adak Kilisesi', 'A twin-towered neo-Romanesque cathedral.', 'Çift kuleli neo-Romanesk katedral.'),
  (1985, '348', 'Debrecen', 'Debrecen', 'Great Reformed Church', 'Büyük Reform Kilisesi', 'The largest Protestant church in Hungary.', 'Macaristan''ın en büyük Protestan kilisesi.'),
  (1986, '348', 'Godollo', 'Gödöllő', 'Gödöllő Royal Palace', 'Gödöllő Kraliyet Sarayı', 'A baroque palace beloved by Empress Sisi.', 'İmparatoriçe Sisi''nin çok sevdiği barok saray.'),
  (1987, '348', 'Fertod', 'Fertőd', 'Esterházy Palace', 'Esterházy Sarayı', 'A baroque palace known as the Hungarian Versailles.', '"Macar Versailles''ı" olarak bilinen barok saray.'),
  (1988, '348', 'Keszthely', 'Keszthely', 'Festetics Palace', 'Festetics Sarayı', 'A palace with a library of 90,000 volumes.', '90.000 ciltlik kütüphanesiyle ünlü saray.'),
  (1989, '348', 'Sopron', 'Sopron', 'Fire Tower', 'Ateş Kulesi', 'A medieval tower, symbol of Sopron.', 'Sopron''un simgesi olan ortaçağ kulesi.'),
  (1990, '348', 'Aggtelek', 'Aggtelek', 'Baradla Cave', 'Baradla Mağarası', 'The largest cave system in the Aggtelek Karst, with stalactite halls.', 'Aggtelek Karst''ının en büyük mağara sistemi, sarkıtlarla dolu salonlarıyla ünlü.');

-- Cities (reuses an existing city with the same English name per country).
insert into public.cities (country_id, name, name_tr)
select distinct on (country_id, city) country_id, city, city_tr
from _new_landmarks
order by country_id, city, ord
on conflict (country_id, name) do nothing;

insert into public.landmarks
  (country_id, city_id, name, name_tr, description, description_tr, sort_order)
select n.country_id, c.id, n.name, n.name_tr, n.description, n.description_tr, n.ord
from _new_landmarks n
join public.cities c on c.country_id = n.country_id and c.name = n.city
order by n.ord
on conflict (city_id, name) do nothing;

commit;

-- Check afterwards (should be 18 dishes and 11 + 33 landmarks):
-- select count(*) from public.cuisine_meals where country_id = '348';
-- select count(*) from public.landmarks where country_id = '348';
