import {
  fetchIslandIndex,
  getCachedIslandIndex,
  type IslandIndex,
} from "@/data/islands";
import { useEffect, useState } from "react";

const EMPTY: IslandIndex = { counts: {}, countryByIslandId: {} };

/** Stale-while-revalidate id -> country_id / country_id -> count index, used
 * by the continent and country picker screens to show where content already
 * exists and to compute visited-vs-total fractions. `loading` stays true
 * until either the cache or the network fetch resolves at least once — the
 * picker screens filter continents/countries by `counts[id] > 0`, which
 * would otherwise read as "genuinely empty" during the gap before either
 * resolves, rather than "not loaded yet". */
export function useIslandsIndex(): IslandIndex & { loading: boolean } {
  const [index, setIndex] = useState<IslandIndex>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCachedIslandIndex().then((cached) => {
      if (cached && !cancelled) {
        setIndex(cached);
        setLoading(false);
      }
    });

    fetchIslandIndex()
      .then((fresh) => {
        if (!cancelled) {
          setIndex(fresh);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.log("ISLANDS INDEX FETCH ERROR", e);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...index, loading };
}
