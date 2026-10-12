import { HERITAGE_IMAGES_CACHE_KEY } from "@/data/storageKeys";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Photos for heritage sites, keyed by site id. The site list itself is a
 * bundled JSON (see heritageSites.ts); the photos live in the Supabase
 * `heritage_images` table (scripts/heritage_images_schema.sql) so they can be
 * added from the admin panel without an app update. This module is a tiny
 * external store (module-level map + subscribers) rather than per-component
 * state, because the thumbnail is rendered in long lists — every row must
 * share one fetch, not each run its own. */
let imageMap: Record<string, string> = {};
const listeners = new Set<() => void>();
let loadPromise: Promise<void> | null = null;

function setImageMap(next: Record<string, string>) {
  imageMap = next;
  listeners.forEach((listener) => listener());
}

export function subscribeHeritageImages(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Snapshot for useSyncExternalStore — the map is replaced, never mutated,
 * so reference equality tells React whether anything changed. */
export function getHeritageImageMap(): Record<string, string> {
  return imageMap;
}

export function getHeritageImageUrl(id: string): string | null {
  return imageMap[id] ?? null;
}

async function readCache(): Promise<Record<string, string> | null> {
  const raw = await AsyncStorage.getItem(HERITAGE_IMAGES_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    console.log("HERITAGE IMAGES CACHE PARSE ERROR", e);
    return null;
  }
}

const PAGE_SIZE = 1000;

/** Live-fetches every row, paginating in PAGE_SIZE pages — PostgREST caps a
 * single response at 1000 rows by default, and the heritage list has ~1273
 * sites, so a fully photographed list would otherwise be silently cut off. */
async function fetchImageMap(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("heritage_images")
      .select("site_id, image_url")
      .order("site_id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    for (const row of data as { site_id: string; image_url: string }[]) {
      map[row.site_id] = row.image_url;
    }
    if (data.length < PAGE_SIZE) break;
  }
  return map;
}

/** Stale-while-revalidate, once per app session: shows the cached map
 * immediately, then replaces it with a fresh fetch (and re-caches). Never
 * throws — a failed fetch just leaves whatever the cache had. Deliberately
 * not awaited by the startup gate in app/_layout.tsx: photos popping in a
 * moment late is better than holding the splash screen on a network call. */
export function loadHeritageImages(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const cached = await readCache();
        if (cached) setImageMap(cached);
      } catch (e) {
        console.log("HERITAGE IMAGES CACHE READ ERROR", e);
      }

      try {
        const fresh = await fetchImageMap();
        setImageMap(fresh);
        await AsyncStorage.setItem(HERITAGE_IMAGES_CACHE_KEY, JSON.stringify(fresh));
      } catch (e) {
        console.log("HERITAGE IMAGES FETCH ERROR", e);
      }
    })();
  }
  return loadPromise;
}
