import type { CityMap, CityMapIndexEntry } from "@/data/cityMaps";
import {
  getCityMapIndex,
  loadCityMap,
  loadCityMapIndex,
  peekCityMap,
  subscribeCityMapIndex,
} from "@/data/cityMapStore";
import { useEffect, useState, useSyncExternalStore } from "react";

/** City id → bbox + version for every city map in Supabase
 * (data/cityMapStore.ts). Empty until the (once-per-session) load finishes. */
export function useCityMapIndex(): Record<string, CityMapIndexEntry> {
  useEffect(() => {
    loadCityMapIndex();
  }, []);
  return useSyncExternalStore(subscribeCityMapIndex, getCityMapIndex, getCityMapIndex);
}

type CityMapResult = { map: CityMap | null; failed: boolean };

/** The full map of city `id` at version `updatedAt`: `map` is null while it
 * loads, `failed` once it could not be had at all. Pass nulls for "no map". */
export function useCityMap(id: string | null, updatedAt: string | null): CityMapResult {
  const key = id && updatedAt ? `${id}@${updatedAt}` : null;
  const [result, setResult] = useState<(CityMapResult & { key: string }) | null>(null);

  useEffect(() => {
    if (!id || !updatedAt || !key) return;
    let cancelled = false;
    loadCityMap(id, updatedAt).then((map) => {
      if (!cancelled) setResult({ key, map, failed: map === null });
    });
    return () => {
      cancelled = true;
    };
  }, [id, updatedAt, key]);

  if (!id || !updatedAt || !key) return { map: null, failed: false };
  const ready = peekCityMap(id, updatedAt);
  if (ready) return { map: ready, failed: false };
  if (result?.key === key) return { map: result.map, failed: result.failed };
  return { map: null, failed: false };
}
