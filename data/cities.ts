import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export type City = {
  id: string;
  countryId: string;
  name: string;
  nameTr: string | null;
};

type CityRow = {
  id: number;
  country_id: string;
  name: string;
  name_tr: string | null;
};

function fromRow(row: CityRow): City {
  return {
    id: String(row.id),
    countryId: row.country_id,
    name: row.name,
    nameTr: row.name_tr,
  };
}

export function localizedCityName(city: City, language: "tr" | "en"): string {
  return (language === "tr" && city.nameTr) || city.name;
}

const CITIES_CACHE_PREFIX = "cities_";
const INDEX_CACHE_KEY = "cities_index";

async function getCachedCities(countryId: string): Promise<City[] | null> {
  const raw = await AsyncStorage.getItem(CITIES_CACHE_PREFIX + countryId);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log("CITIES CACHE PARSE ERROR", e);
    return null;
  }
}

/** Live-fetches a country's cities from Supabase and refreshes the local
 * cache. Used by the admin panel's city dropdown and the landmarks city
 * picker/terminal screens. Throws on failure — callers fall back to the
 * cache. */
export async function fetchCitiesForCountry(countryId: string): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("country_id", countryId)
    .order("name", { ascending: true });

  if (error) throw error;

  const cities = (data as CityRow[]).map(fromRow);
  await AsyncStorage.setItem(CITIES_CACHE_PREFIX + countryId, JSON.stringify(cities));
  return cities;
}

export type CityIndex = {
  /** city id -> the City record, for resolving a landmark's city id to a
   * display name without a per-screen round trip. */
  byId: Record<string, City>;
};

async function getCachedCityIndex(): Promise<CityIndex | null> {
  const raw = await AsyncStorage.getItem(INDEX_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log("CITIES INDEX CACHE PARSE ERROR", e);
    return null;
  }
}

const INDEX_PAGE_SIZE = 1000;

/** Live-fetches every city, paginating in INDEX_PAGE_SIZE-row pages —
 * Supabase/PostgREST caps a single response at 1000 rows by default, which
 * would otherwise silently truncate results once cities grows past that.
 * Used by the landmarks city picker/terminal screens to resolve city ids to
 * display names. */
export async function fetchCityIndex(): Promise<CityIndex> {
  const byId: Record<string, City> = {};

  for (let from = 0; ; from += INDEX_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .range(from, from + INDEX_PAGE_SIZE - 1);
    if (error) throw error;

    for (const row of data as CityRow[]) {
      const city = fromRow(row);
      byId[city.id] = city;
    }

    if (data.length < INDEX_PAGE_SIZE) break;
  }

  const index: CityIndex = { byId };
  await AsyncStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(index));
  return index;
}

export { getCachedCities, getCachedCityIndex };
