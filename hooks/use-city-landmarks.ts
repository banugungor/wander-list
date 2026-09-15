import {
  fetchLandmarksForCity,
  getCachedLandmarks,
  type Landmark,
} from "@/data/landmarks";
import { useCallback, useEffect, useState } from "react";

/** Stale-while-revalidate: shows the last cached landmark list for this
 * city instantly (if any), then refreshes from Supabase in the background
 * so landmarks you just added show up without an app update. */
export function useCityLandmarks(countryId: string, cityId: string) {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const cached = await getCachedLandmarks(countryId, cityId);
    if (cached) {
      setLandmarks(cached);
      setLoading(false);
    }

    try {
      const fresh = await fetchLandmarksForCity(countryId, cityId);
      setLandmarks(fresh);
    } catch (e) {
      console.log("LANDMARKS FETCH ERROR", e);
    } finally {
      setLoading(false);
    }
  }, [countryId, cityId]);

  useEffect(() => {
    load();
  }, [load]);

  return { landmarks, loading };
}
