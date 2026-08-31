import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export type Island = {
  id: string;
  countryId: string;
  name: string;
  nameTr: string | null;
  description: string | null;
  descriptionTr: string | null;
  imageUrl: string | null;
};

type IslandRow = {
  id: number;
  country_id: string;
  name: string;
  name_tr: string | null;
  description: string | null;
  description_tr: string | null;
  image_url: string | null;
};

function fromRow(row: IslandRow): Island {
  return {
    id: String(row.id),
    countryId: row.country_id,
    name: row.name,
    nameTr: row.name_tr,
    description: row.description,
    descriptionTr: row.description_tr,
    imageUrl: row.image_url,
  };
}

export function localizedIslandName(island: Island, language: "tr" | "en"): string {
  return (language === "tr" && island.nameTr) || island.name;
}

export function localizedIslandDescription(
  island: Island,
  language: "tr" | "en",
): string | null {
  return (language === "tr" && island.descriptionTr) || island.description;
}

const ISLANDS_CACHE_PREFIX = "islands_";
const INDEX_CACHE_KEY = "islands_index";

async function getCachedIslands(countryId: string): Promise<Island[] | null> {
  const raw = await AsyncStorage.getItem(ISLANDS_CACHE_PREFIX + countryId);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log("ISLANDS CACHE PARSE ERROR", e);
    return null;
  }
}

/** Live-fetches a country's island list from Supabase and refreshes the
 * local cache. Throws on failure — callers fall back to the cache (see
 * useCountryIslands) rather than surfacing this to the user. */
export async function fetchIslandsForCountry(countryId: string): Promise<Island[]> {
  const { data, error } = await supabase
    .from("islands")
    .select("*")
    .eq("country_id", countryId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const islands = (data as IslandRow[]).map(fromRow);
  await AsyncStorage.setItem(ISLANDS_CACHE_PREFIX + countryId, JSON.stringify(islands));
  return islands;
}

export type IslandIndex = {
  /** country id -> how many islands exist for it. */
  counts: Record<string, number>;
  /** island id -> the country id it belongs to, for turning a local list of
   * visited island ids into a per-country/per-continent visited count
   * without an extra round trip per screen. */
  countryByIslandId: Record<string, string>;
};

async function getCachedIslandIndex(): Promise<IslandIndex | null> {
  const raw = await AsyncStorage.getItem(INDEX_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log("ISLANDS INDEX CACHE PARSE ERROR", e);
    return null;
  }
}

/** Live-fetches every island's (id, country_id) in one round trip — used by
 * the continent/country picker for per-row and overall totals. */
export async function fetchIslandIndex(): Promise<IslandIndex> {
  const { data, error } = await supabase.from("islands").select("id, country_id");
  if (error) throw error;

  const counts: Record<string, number> = {};
  const countryByIslandId: Record<string, string> = {};
  for (const row of data as { id: number; country_id: string }[]) {
    counts[row.country_id] = (counts[row.country_id] ?? 0) + 1;
    countryByIslandId[String(row.id)] = row.country_id;
  }

  const index: IslandIndex = { counts, countryByIslandId };
  await AsyncStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(index));
  return index;
}

/** Turns a local list of visited island ids into a per-country tally, using
 * the id -> country_id map from fetchIslandIndex/getCachedIslandIndex. */
export function visitedCountByCountry(
  visitedIslandIds: string[],
  countryByIslandId: Record<string, string>,
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const islandId of visitedIslandIds) {
    const countryId = countryByIslandId[islandId];
    if (countryId) tally[countryId] = (tally[countryId] ?? 0) + 1;
  }
  return tally;
}

export { getCachedIslands, getCachedIslandIndex };
