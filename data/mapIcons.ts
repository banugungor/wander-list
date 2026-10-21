import { createImageMapStore } from "@/data/imageMapStore";
import { MAP_ICONS_CACHE_KEY } from "@/data/storageKeys";

/** The icon-map key of a place: "landmarks:<landmark id>" or
 * "heritage:<site id>" — the same `ref` an activity picked from those lists
 * carries (data/trips.ts). */
export const mapIconKey = (category: "landmarks" | "heritage", id: string) =>
  `${category}:${id}`;

/** Small illustrated building icons for the trip map, keyed by `mapIconKey`,
 * from the Supabase `map_icons` table (scripts/map_icons_schema.sql, added
 * from the admin panel's "Harita ikonu" tab). A place without a row keeps the
 * plain numbered pin. Loaded lazily by `useMapIcons`, not at startup. */
const store = createImageMapStore({
  table: "map_icons",
  keyColumn: "item_key",
  cacheKey: MAP_ICONS_CACHE_KEY,
  label: "MAP ICONS",
});

export const subscribeMapIcons = store.subscribe;
export const getMapIconMap = store.getMap;
export const loadMapIcons = store.load;
