import { createRemoteMapStore } from "@/data/remoteMapStore";
import { LANDMARK_DETAIL_IDS_CACHE_KEY } from "@/data/storageKeys";

/** Which landmarks have a detail page (`landmarks.has_details`, true once the
 * admin panel's long-text fields are filled in), keyed by landmark id. Only
 * those rows are fetched, and no text — the page itself is loaded on demand by
 * `fetchLandmarkDetail` (data/landmarks.ts). Loaded lazily by
 * `useLandmarkDetailIds`, not at startup. */
const store = createRemoteMapStore<true>({
  table: "landmarks",
  keyColumn: "id",
  valueColumns: "has_details",
  requireColumn: "has_details",
  toValue: (row) => (row.has_details === true ? true : null),
  cacheKey: LANDMARK_DETAIL_IDS_CACHE_KEY,
  label: "LANDMARK DETAIL IDS",
});

export const subscribeLandmarkDetailIds = store.subscribe;
export const getLandmarkDetailIdMap = store.getMap;
export const loadLandmarkDetailIds = store.load;
