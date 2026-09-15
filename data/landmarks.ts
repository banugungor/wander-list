import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export type Landmark = {
  id: string;
  countryId: string;
  cityId: string;
  name: string;
  nameTr: string | null;
  description: string | null;
  descriptionTr: string | null;
  imageUrl: string | null;
};

type LandmarkRow = {
  id: number;
  country_id: string;
  city_id: number;
  name: string;
  name_tr: string | null;
  description: string | null;
  description_tr: string | null;
  image_url: string | null;
};

function fromRow(row: LandmarkRow): Landmark {
  return {
    id: String(row.id),
    countryId: row.country_id,
    cityId: String(row.city_id),
    name: row.name,
    nameTr: row.name_tr,
    description: row.description,
    descriptionTr: row.description_tr,
    imageUrl: row.image_url,
  };
}

export function localizedLandmarkName(landmark: Landmark, language: "tr" | "en"): string {
  return (language === "tr" && landmark.nameTr) || landmark.name;
}

export function localizedLandmarkDescription(
  landmark: Landmark,
  language: "tr" | "en",
): string | null {
  return (language === "tr" && landmark.descriptionTr) || landmark.description;
}

const LANDMARKS_CACHE_PREFIX = "landmarks_";
const INDEX_CACHE_KEY = "landmarks_index";

async function getCachedLandmarks(
  countryId: string,
  cityId: string,
): Promise<Landmark[] | null> {
  const raw = await AsyncStorage.getItem(`${LANDMARKS_CACHE_PREFIX}${countryId}_${cityId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log("LANDMARKS CACHE PARSE ERROR", e);
    return null;
  }
}

/** Live-fetches a city's landmark list from Supabase and refreshes the
 * local cache. Throws on failure — callers fall back to the cache (see
 * useCityLandmarks) rather than surfacing this to the user. */
export async function fetchLandmarksForCity(
  countryId: string,
  cityId: string,
): Promise<Landmark[]> {
  const { data, error } = await supabase
    .from("landmarks")
    .select("*")
    .eq("country_id", countryId)
    .eq("city_id", cityId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const landmarks = (data as LandmarkRow[]).map(fromRow);
  await AsyncStorage.setItem(
    `${LANDMARKS_CACHE_PREFIX}${countryId}_${cityId}`,
    JSON.stringify(landmarks),
  );
  return landmarks;
}

export type LandmarkIndex = {
  /** country id -> how many landmarks exist for it. */
  countByCountry: Record<string, number>;
  /** city id -> how many landmarks exist for it. */
  countByCity: Record<string, number>;
  /** country id -> the ids of cities within it that have at least one
   * landmark, for the city picker screen. */
  cityIdsByCountry: Record<string, string[]>;
  /** landmark id -> the country id it belongs to. */
  countryByLandmarkId: Record<string, string>;
  /** landmark id -> the city id it belongs to. */
  cityByLandmarkId: Record<string, string>;
};

async function getCachedLandmarkIndex(): Promise<LandmarkIndex | null> {
  const raw = await AsyncStorage.getItem(INDEX_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log("LANDMARKS INDEX CACHE PARSE ERROR", e);
    return null;
  }
}

const INDEX_PAGE_SIZE = 1000;

/** Live-fetches every landmark's (id, country_id, city_id), paginating in
 * INDEX_PAGE_SIZE-row pages — Supabase/PostgREST caps a single response at
 * 1000 rows by default, which would otherwise silently truncate (and
 * plateau) counts once landmarks grows past that. Used by the continent,
 * country and city picker screens for per-row and overall totals. */
export async function fetchLandmarkIndex(): Promise<LandmarkIndex> {
  const countByCountry: Record<string, number> = {};
  const countByCity: Record<string, number> = {};
  const cityIdsByCountrySet: Record<string, Set<string>> = {};
  const countryByLandmarkId: Record<string, string> = {};
  const cityByLandmarkId: Record<string, string> = {};

  for (let from = 0; ; from += INDEX_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("landmarks")
      .select("id, country_id, city_id")
      .range(from, from + INDEX_PAGE_SIZE - 1);
    if (error) throw error;

    for (const row of data as { id: number; country_id: string; city_id: number }[]) {
      const id = String(row.id);
      const cityId = String(row.city_id);

      countByCountry[row.country_id] = (countByCountry[row.country_id] ?? 0) + 1;
      countByCity[cityId] = (countByCity[cityId] ?? 0) + 1;
      countryByLandmarkId[id] = row.country_id;
      cityByLandmarkId[id] = cityId;

      const cities = cityIdsByCountrySet[row.country_id] ?? new Set<string>();
      cities.add(cityId);
      cityIdsByCountrySet[row.country_id] = cities;
    }

    if (data.length < INDEX_PAGE_SIZE) break;
  }

  const cityIdsByCountry: Record<string, string[]> = {};
  for (const [countryId, cities] of Object.entries(cityIdsByCountrySet)) {
    cityIdsByCountry[countryId] = Array.from(cities);
  }

  const index: LandmarkIndex = {
    countByCountry,
    countByCity,
    cityIdsByCountry,
    countryByLandmarkId,
    cityByLandmarkId,
  };
  await AsyncStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(index));
  return index;
}

/** Turns a local list of visited landmark ids into a per-country tally,
 * using the id -> country_id map from fetchLandmarkIndex/getCachedLandmarkIndex. */
export function visitedCountByCountry(
  visitedLandmarkIds: string[],
  countryByLandmarkId: Record<string, string>,
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const landmarkId of visitedLandmarkIds) {
    const countryId = countryByLandmarkId[landmarkId];
    if (countryId) tally[countryId] = (tally[countryId] ?? 0) + 1;
  }
  return tally;
}

/** Same as visitedCountByCountry but tallied per city, using the id ->
 * city_id map from fetchLandmarkIndex/getCachedLandmarkIndex. */
export function visitedCountByCity(
  visitedLandmarkIds: string[],
  cityByLandmarkId: Record<string, string>,
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const landmarkId of visitedLandmarkIds) {
    const cityId = cityByLandmarkId[landmarkId];
    if (cityId) tally[cityId] = (tally[cityId] ?? 0) + 1;
  }
  return tally;
}

export { getCachedLandmarks, getCachedLandmarkIndex };
