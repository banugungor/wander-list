import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PAGE_SIZE = 1000;

type Config = {
  /** Supabase table holding one `image_url` per key. */
  table: string;
  /** Name of the table's key column (e.g. `site_id`, `country_id`). */
  keyColumn: string;
  cacheKey: string;
  /** Used in console messages only. */
  label: string;
};

/** A small external store (module-level map + subscribers, for
 * `useSyncExternalStore`) of `key → photo URL` rows from a Supabase table —
 * shared by every admin-panel photo override (heritage sites, countries).
 * It's a store rather than per-component state because the photo shows up in
 * long lists, and every row must share one fetch instead of each running its
 * own. */
export function createImageMapStore({ table, keyColumn, cacheKey, label }: Config) {
  let imageMap: Record<string, string> = {};
  const listeners = new Set<() => void>();
  let loadPromise: Promise<void> | null = null;

  const setImageMap = (next: Record<string, string>) => {
    imageMap = next;
    listeners.forEach((listener) => listener());
  };

  async function readCache(): Promise<Record<string, string> | null> {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      console.log(`${label} IMAGES CACHE PARSE ERROR`, e);
      return null;
    }
  }

  /** Live-fetches every row, paginating in PAGE_SIZE pages — PostgREST caps a
   * single response at 1000 rows by default, so a big table would otherwise
   * be silently cut off. */
  async function fetchImageMap(): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from(table)
        .select(`${keyColumn}, image_url`)
        .order(keyColumn)
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;

      const rows = (data ?? []) as unknown as Record<string, string>[];
      for (const row of rows) map[row[keyColumn]] = row.image_url;
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
    getMap: (): Record<string, string> => imageMap,

    getUrl: (key: string): string | null => imageMap[key] ?? null,

    /** Stale-while-revalidate, once per app session: shows the cached map
     * immediately, then replaces it with a fresh fetch (and re-caches).
     * Never throws — a failed fetch just leaves whatever the cache had.
     * Deliberately not awaited by the startup gate in app/_layout.tsx: photos
     * popping in a moment late is better than holding the splash screen on a
     * network call. */
    load(): Promise<void> {
      if (!loadPromise) {
        loadPromise = (async () => {
          try {
            const cached = await readCache();
            if (cached) setImageMap(cached);
          } catch (e) {
            console.log(`${label} IMAGES CACHE READ ERROR`, e);
          }

          try {
            const fresh = await fetchImageMap();
            setImageMap(fresh);
            await AsyncStorage.setItem(cacheKey, JSON.stringify(fresh));
          } catch (e) {
            console.log(`${label} IMAGES FETCH ERROR`, e);
          }
        })();
      }
      return loadPromise;
    },
  };
}
