import type { LatLng } from "@/data/cityMaps";
import { createRemoteMapStore } from "@/data/remoteMapStore";
import { LANDMARK_COORDS_CACHE_KEY } from "@/data/storageKeys";

/** Map positions for landmarks, keyed by landmark id, from the nullable
 * `lat`/`lng` columns of the Supabase `landmarks` table (filled by hand-run
 * scripts such as scripts/add_landmark_coords_rome.sql). Only rows that have
 * coordinates are fetched, so the map stays tiny while few cities are done.
 * Used by the trip map (components/trip-map.tsx); everything else about a
 * landmark still comes from data/landmarks.ts. Loaded lazily by
 * `useLandmarkCoords`, not at startup. */
const store = createRemoteMapStore<LatLng>({
  table: "landmarks",
  keyColumn: "id",
  valueColumns: "lat, lng",
  requireColumn: "lat",
  toValue: (row) =>
    typeof row.lat === "number" && typeof row.lng === "number"
      ? { lat: row.lat, lng: row.lng }
      : null,
  cacheKey: LANDMARK_COORDS_CACHE_KEY,
  label: "LANDMARK COORDS",
});

export const subscribeLandmarkCoords = store.subscribe;
export const getLandmarkCoordMap = store.getMap;
export const loadLandmarkCoords = store.load;
