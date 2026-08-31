import {
  fetchIslandsForCountry,
  getCachedIslands,
  type Island,
} from "@/data/islands";
import { useCallback, useEffect, useState } from "react";

/** Stale-while-revalidate: shows the last cached island list for this
 * country instantly (if any), then refreshes from Supabase in the
 * background so islands you just added show up without an app update. */
export function useCountryIslands(countryId: string) {
  const [islands, setIslands] = useState<Island[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const cached = await getCachedIslands(countryId);
    if (cached) {
      setIslands(cached);
      setLoading(false);
    }

    try {
      const fresh = await fetchIslandsForCountry(countryId);
      setIslands(fresh);
    } catch (e) {
      console.log("ISLANDS FETCH ERROR", e);
    } finally {
      setLoading(false);
    }
  }, [countryId]);

  useEffect(() => {
    load();
  }, [load]);

  return { islands, loading };
}
