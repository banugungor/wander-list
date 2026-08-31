import {
  fetchIslandIndex,
  getCachedIslandIndex,
  type IslandIndex,
} from "@/data/islands";
import { useEffect, useState } from "react";

const EMPTY: IslandIndex = { counts: {}, countryByIslandId: {} };

/** Stale-while-revalidate id -> country_id / country_id -> count index, used
 * by the continent and country picker screens to show where content already
 * exists and to compute visited-vs-total fractions. */
export function useIslandsIndex(): IslandIndex {
  const [index, setIndex] = useState<IslandIndex>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    getCachedIslandIndex().then((cached) => {
      if (cached && !cancelled) setIndex(cached);
    });

    fetchIslandIndex()
      .then((fresh) => {
        if (!cancelled) setIndex(fresh);
      })
      .catch((e) => console.log("ISLANDS INDEX FETCH ERROR", e));

    return () => {
      cancelled = true;
    };
  }, []);

  return index;
}
