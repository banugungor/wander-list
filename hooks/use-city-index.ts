import { fetchCityIndex, getCachedCityIndex, type CityIndex } from "@/data/cities";
import { useEffect, useState } from "react";

const EMPTY: CityIndex = { byId: {} };

/** Stale-while-revalidate city id -> City record index, used by the
 * landmarks city picker and terminal screens to resolve a city id to its
 * display name without a per-screen round trip. Pass `enabled = false` to
 * skip the fetch (a screen that only sometimes needs city names). */
export function useCityIndex(enabled = true): CityIndex & { loading: boolean } {
  const [index, setIndex] = useState<CityIndex>(EMPTY);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    getCachedCityIndex().then((cached) => {
      if (cached && !cancelled) {
        setIndex(cached);
        setLoading(false);
      }
    });

    fetchCityIndex()
      .then((fresh) => {
        if (!cancelled) {
          setIndex(fresh);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.log("CITY INDEX FETCH ERROR", e);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { ...index, loading };
}
