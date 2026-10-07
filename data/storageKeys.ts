export const HERITAGE_VISITED_KEY = "visited_heritage";

export const CUISINE_VISITED_KEY = "visited_meals";
export const CUISINE_AREA_TOTALS_KEY = "cuisine_area_totals";

export const ISLANDS_VISITED_KEY = "visited_islands";

export const LANDMARKS_VISITED_KEY = "visited_landmarks";

export const PLACES_VISITED_KEY = "visited_countries";

export const ACTIVITY_LOG_KEY = "activity_log_v1";

export const CATALOG_HIGHLIGHTS_KEY = "catalog_highlights_v1";

export const APP_LANGUAGE_KEY = "app_language";

// Offline read cache of the signed-in user's trips (see data/trips.ts). The
// source of truth is the Supabase `trips` table, so this is NOT part of the
// cloud-synced keys; the user id is appended to keep accounts apart.
export const TRIPS_CACHE_KEY_PREFIX = "trips_cache_v1_";
