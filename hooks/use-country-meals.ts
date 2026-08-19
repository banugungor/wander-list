import {
  fetchMealsForCountry,
  getCachedMeals,
  type CuisineMeal,
} from "@/data/cuisineMeals";
import { useCallback, useEffect, useState } from "react";

/** Stale-while-revalidate: shows the last cached meal list for this country
 * instantly (if any), then refreshes from Supabase in the background so
 * meals you just added show up without an app update. */
export function useCountryMeals(countryId: string) {
  const [meals, setMeals] = useState<CuisineMeal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const cached = await getCachedMeals(countryId);
    if (cached) {
      setMeals(cached);
      setLoading(false);
    }

    try {
      const fresh = await fetchMealsForCountry(countryId);
      setMeals(fresh);
    } catch (e) {
      console.log("CUISINE MEALS FETCH ERROR", e);
    } finally {
      setLoading(false);
    }
  }, [countryId]);

  useEffect(() => {
    load();
  }, [load]);

  return { meals, loading };
}
