import {
  fetchLandmarkIndex,
  getCachedLandmarkIndex,
  type LandmarkIndex,
} from "@/data/landmarks";
import { useEffect, useState } from "react";

const EMPTY: LandmarkIndex = {
  countByCountry: {},
  countByCity: {},
  cityIdsByCountry: {},
  countryByLandmarkId: {},
  cityByLandmarkId: {},
};

/** Stale-while-revalidate landmark index, used by the continent, country
 * and city picker screens to show where content already exists and to
 * compute visited-vs-total fractions. `loading` stays true until either the
 * cache or the network fetch resolves at least once — the picker screens
 * filter by `count > 0`, which would otherwise read as "genuinely empty"
 * during the gap before either resolves, rather than "not loaded yet". */
export function useLandmarksIndex(): LandmarkIndex & { loading: boolean } {
  const [index, setIndex] = useState<LandmarkIndex>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCachedLandmarkIndex().then((cached) => {
      if (cached && !cancelled) {
        setIndex(cached);
        setLoading(false);
      }
    });

    fetchLandmarkIndex()
      .then((fresh) => {
        if (!cancelled) {
          setIndex(fresh);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.log("LANDMARKS INDEX FETCH ERROR", e);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...index, loading };
}
