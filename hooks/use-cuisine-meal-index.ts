import {
  fetchMealIndex,
  getCachedMealIndex,
  type CuisineMealIndex,
} from "@/data/cuisineMeals";
import { useEffect, useState } from "react";

const EMPTY: CuisineMealIndex = { counts: {}, countryByMealId: {} };

/** Stale-while-revalidate id -> country_id / country_id -> count index, used
 * by the continent and country picker screens to show where content already
 * exists and to compute tasted-vs-total fractions. `loading` stays true
 * until either the cache or the network fetch resolves at least once — the
 * continent picker filters continents by `counts[id] > 0`, which would
 * otherwise read as "genuinely empty" during the gap before either
 * resolves, rather than "not loaded yet". */
export function useCuisineMealIndex(): CuisineMealIndex & { loading: boolean } {
  const [index, setIndex] = useState<CuisineMealIndex>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCachedMealIndex().then((cached) => {
      if (cached && !cancelled) {
        setIndex(cached);
        setLoading(false);
      }
    });

    fetchMealIndex()
      .then((fresh) => {
        if (!cancelled) {
          setIndex(fresh);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.log("CUISINE MEAL INDEX FETCH ERROR", e);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...index, loading };
}
