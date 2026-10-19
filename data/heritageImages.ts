import { createImageMapStore } from "@/data/imageMapStore";
import { HERITAGE_IMAGES_CACHE_KEY } from "@/data/storageKeys";

/** Photos for heritage sites, keyed by site id. The site list itself is a
 * bundled JSON (see heritageSites.ts); the photos live in the Supabase
 * `heritage_images` table (scripts/heritage_images_schema.sql) so they can be
 * added from the admin panel without an app update. See imageMapStore.ts for
 * how the store loads and caches them. */
const store = createImageMapStore({
  table: "heritage_images",
  keyColumn: "site_id",
  cacheKey: HERITAGE_IMAGES_CACHE_KEY,
  label: "HERITAGE",
});

export const subscribeHeritageImages = store.subscribe;
export const getHeritageImageMap = store.getMap;
export const getHeritageImageUrl = store.getUrl;
export const loadHeritageImages = store.load;
