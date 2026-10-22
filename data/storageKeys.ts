export const HERITAGE_VISITED_KEY = "visited_heritage";
// Offline read cache of the Supabase heritage_images table (site id -> photo
// URL, see data/heritageImages.ts). Not user data, so not a cloud-synced key.
export const HERITAGE_IMAGES_CACHE_KEY = "heritage_images_v1";
// Same idea for country_images (country id -> cover photo URL, data/countryImages.ts).
export const COUNTRY_IMAGES_CACHE_KEY = "country_images_v1";
// Offline read cache of the landmark coordinates the trip map uses (landmark
// id -> [lat, lng], data/landmarkCoords.ts). Not user data either.
export const LANDMARK_COORDS_CACHE_KEY = "landmark_coords_v1";
// Offline read cache of which landmarks have a detail page (landmark id -> true,
// data/landmarkDetails.ts), and one entry per opened detail page (prefix + id,
// data/landmarks.ts). Not user data either.
export const LANDMARK_DETAIL_IDS_CACHE_KEY = "landmark_detail_ids_v1";
export const LANDMARK_DETAIL_CACHE_KEY_PREFIX = "landmark_detail_v1_";
// Offline read cache of the trip map's building icons (item key -> image URL,
// data/mapIcons.ts). Not user data either.
export const MAP_ICONS_CACHE_KEY = "map_icons_v1";

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
