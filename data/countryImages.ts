import { createImageMapStore } from "@/data/imageMapStore";
import { COUNTRY_IMAGES_CACHE_KEY } from "@/data/storageKeys";

/** One cover photo per country, keyed by `worldCountries.json` id, from the
 * Supabase `country_images` table (scripts/country_images_schema.sql, added
 * from the admin panel's "Ülkeler" tab). Used for trip covers; a country
 * without a photo falls back to the gradient + flag cover. */
const store = createImageMapStore({
  table: "country_images",
  keyColumn: "country_id",
  cacheKey: COUNTRY_IMAGES_CACHE_KEY,
  label: "COUNTRY",
});

export const subscribeCountryImages = store.subscribe;
export const getCountryImageMap = store.getMap;
export const getCountryImageUrl = store.getUrl;
export const loadCountryImages = store.load;
