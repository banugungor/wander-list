import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

// A names-only copy of each Supabase-backed category, so the first screen of
// Cuisine/Islands/Landmarks can search individual dishes/islands/landmarks by
// name (the existing `*Index` fetches only carry ids/counts, and the full
// per-country lists are only fetched one country at a time). It's fetched
// lazily — only once the user types in a search box — then cached, so search
// also works offline after the first use. Heritage doesn't need this: its
// whole dataset is bundled.

export type NameIndexCategory = "cuisine" | "islands" | "landmarks";

export type NameIndexEntry = {
  id: string;
  countryId: string;
  /** Only landmarks have a city level. */
  cityId: string | null;
  name: string;
  nameTr: string | null;
  imageUrl: string | null;
};

type Row = {
  id: number;
  country_id: string;
  city_id?: number | null;
  name: string;
  name_tr: string | null;
  image_url: string | null;
};

const SOURCES: Record<NameIndexCategory, { table: string; columns: string }> = {
  cuisine: { table: "cuisine_meals", columns: "id, country_id, name, name_tr, image_url" },
  islands: { table: "islands", columns: "id, country_id, name, name_tr, image_url" },
  landmarks: {
    table: "landmarks",
    columns: "id, country_id, city_id, name, name_tr, image_url",
  },
};

const CACHE_PREFIX = "name_index_v2_";
const PAGE_SIZE = 1000;

// In-memory copy + "already refreshed this session" flags, so the picker and
// the country screens (and repeated searches) share one fetch.
const memory: Partial<Record<NameIndexCategory, NameIndexEntry[]>> = {};
const refreshed: Partial<Record<NameIndexCategory, boolean>> = {};
const inFlight: Partial<Record<NameIndexCategory, Promise<NameIndexEntry[]>>> = {};

/** The last known index (memory, else the AsyncStorage cache), or null. */
export async function getCachedNameIndex(
  category: NameIndexCategory,
): Promise<NameIndexEntry[] | null> {
  const inMemory = memory[category];
  if (inMemory) return inMemory;
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + category);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    memory[category] = parsed;
    return parsed;
  } catch (e) {
    console.log("NAME INDEX CACHE PARSE ERROR", e);
    return null;
  }
}

async function fetchNameIndex(category: NameIndexCategory): Promise<NameIndexEntry[]> {
  const { table, columns } = SOURCES[category];
  const entries: NameIndexEntry[] = [];

  // PostgREST caps a response at 1000 rows by default, so page through.
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    const rows = (data ?? []) as unknown as Row[];
    for (const row of rows) {
      entries.push({
        id: String(row.id),
        countryId: row.country_id,
        cityId: row.city_id != null ? String(row.city_id) : null,
        name: row.name,
        nameTr: row.name_tr,
        imageUrl: row.image_url,
      });
    }
    if (rows.length < PAGE_SIZE) break;
  }

  memory[category] = entries;
  await AsyncStorage.setItem(CACHE_PREFIX + category, JSON.stringify(entries));
  return entries;
}

/** Fetches the index from Supabase at most once per app session (concurrent
 * callers share the request). Throws on failure — callers keep whatever
 * `getCachedNameIndex` gave them. */
export function ensureFreshNameIndex(
  category: NameIndexCategory,
): Promise<NameIndexEntry[]> {
  const existing = inFlight[category];
  if (existing) return existing;

  const cached = memory[category];
  if (refreshed[category] && cached) return Promise.resolve(cached);

  const request = fetchNameIndex(category)
    .then((entries) => {
      refreshed[category] = true;
      return entries;
    })
    .finally(() => {
      delete inFlight[category];
    });
  inFlight[category] = request;
  return request;
}

export function localizedEntryName(
  entry: NameIndexEntry,
  language: "tr" | "en",
): string {
  return (language === "tr" && entry.nameTr) || entry.name;
}
