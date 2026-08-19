import {
  fetchMealIndex,
  getCachedMealIndex,
  type CuisineMealIndex,
} from "@/data/cuisineMeals";
import { useEffect, useState } from "react";

const EMPTY: CuisineMealIndex = { counts: {}, countryByMealId: {} };

/** Stale-while-revalidate id -> country_id / country_id -> count index, used
 * by the continent and country picker screens to show where content already
 * exists and to compute tasted-vs-total fractions. */
export function useCuisineMealIndex(): CuisineMealIndex {
  const [index, setIndex] = useState<CuisineMealIndex>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    getCachedMealIndex().then((cached) => {
      if (cached && !cancelled) setIndex(cached);
    });

    fetchMealIndex()
      .then((fresh) => {
        if (!cancelled) setIndex(fresh);
      })
      .catch((e) => console.log("CUISINE MEAL INDEX FETCH ERROR", e));

    return () => {
      cancelled = true;
    };
  }, []);

  return index;
}
