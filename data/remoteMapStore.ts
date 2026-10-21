import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PAGE_SIZE = 1000;

type Config<T> = {
  /** Supabase table with one row per key. */
  table: string;
  /** Name of the table's key column (e.g. `site_id`, `country_id`, `id`). */
  keyColumn: string;
  /** Extra columns to select next to the key, e.g. `image_url`. */
  valueColumns: string;
  /** Builds the stored value from a row; return null to leave the row out. */
  toValue: (row: Record<string, unknown>) => T | null;
  /** Only rows where this column is not null are fetched (e.g. `lat`, so a
   * table that is mostly empty doesn't ship every key). */
  requireColumn?: string;
  cacheKey: string;
  /** Used in console messages only. */
  label: string;
};

/** A small external store (module-level map + subscribers, for
 * `useSyncExternalStore`) of `key → value` rows from a Supabase table —
 * the shared machinery behind every admin-filled override table: photo URLs
 * (data/imageMapStore.ts: heritage sites, countries) and landmark
 * coordinates (data/landmarkCoords.ts). It's a store rather than
 * per-component state because the values show up in long lists, and every
 * row must share one fetch instead of each running its own. */
export function createRemoteMapStore<T>({
  table,
  keyColumn,
  valueColumns,
  toValue,
  requireColumn,
  cacheKey,
  label,
}: Config<T>) {
  let valueMap: Record<string, T> = {};
  const listeners = new Set<() => void>();
  let loadPromise: Promise<void> | null = null;

  const setMap = (next: Record<string, T>) => {
    valueMap = next;
    listeners.forEach((listener) => listener());
  };

  async function readCache(): Promise<Record<string, T> | null> {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      console.log(`${label} CACHE PARSE ERROR`, e);
      return null;
    }
  }

  /** Live-fetches every row, paginating in PAGE_SIZE pages — PostgREST caps a
   * single response at 1000 rows by default, so a big table would otherwise
   * be silently cut off. */
  async function fetchMap(): Promise<Record<string, T>> {
    const map: Record<string, T> = {};
    for (let from = 0; ; from += PAGE_SIZE) {
      let query = supabase.from(table).select(`${keyColumn}, ${valueColumns}`);
      if (requireColumn) query = query.not(requireColumn, "is", null);
      const { data, error } = await query
        .order(keyColumn)
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;

      const rows = (data ?? []) as unknown as Record<string, unknown>[];
      for (const row of rows) {
        const value = toValue(row);
        if (value !== null) map[String(row[keyColumn])] = value;
      }
      if (rows.length < PAGE_SIZE) break;
    }
    return map;
  }

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** Snapshot for useSyncExternalStore — the map is replaced, never
     * mutated, so reference equality tells React whether anything changed. */
    getMap: (): Record<string, T> => valueMap,

    getValue: (key: string): T | null => valueMap[key] ?? null,

    /** Stale-while-revalidate, once per app session: shows the cached map
     * immediately, then replaces it with a fresh fetch (and re-caches).
     * Never throws — a failed fetch just leaves whatever the cache had.
     * Deliberately not awaited by the startup gate in app/_layout.tsx: values
     * popping in a moment late is better than holding the splash screen on a
     * network call. */
    load(): Promise<void> {
      if (!loadPromise) {
        loadPromise = (async () => {
          try {
            const cached = await readCache();
            if (cached) setMap(cached);
          } catch (e) {
            console.log(`${label} CACHE READ ERROR`, e);
          }

          try {
            const fresh = await fetchMap();
            setMap(fresh);
            await AsyncStorage.setItem(cacheKey, JSON.stringify(fresh));
          } catch (e) {
            console.log(`${label} FETCH ERROR`, e);
          }
        })();
      }
      return loadPromise;
    },
  };
}
