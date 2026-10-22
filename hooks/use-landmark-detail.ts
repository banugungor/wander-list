import {
  fetchLandmarkDetail,
  getCachedLandmarkDetail,
  type LandmarkDetail,
} from "@/data/landmarks";
import { useEffect, useState } from "react";

/** Stale-while-revalidate for one landmark's detail page: the cached copy
 * first (works offline), then a fresh fetch. `loading` is true only until the
 * first of those produces something. */
export function useLandmarkDetail(id: string) {
  const [landmark, setLandmark] = useState<LandmarkDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    getCachedLandmarkDetail(id).then((cached) => {
      if (cached && !cancelled) {
        setLandmark(cached);
        setLoading(false);
      }
    });

    fetchLandmarkDetail(id)
      .then((fresh) => {
        if (!cancelled) setLandmark(fresh);
      })
      .catch((e) => console.log("LANDMARK DETAIL FETCH ERROR", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { landmark, loading };
}
