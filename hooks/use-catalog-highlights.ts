import {
  fetchCatalogHighlights,
  getCachedCatalogHighlights,
  type CatalogHighlight,
} from "@/data/catalogHighlights";
import { useCallback, useEffect, useState } from "react";

/** Stale-while-revalidate: shows the last cached "what's new" feed instantly,
 * then refreshes from Supabase in the background so highlights added after
 * the last app open show up without a manual reload. Drives the home
 * screen's "Son Eklenenler" rail. */
export function useCatalogHighlights(limit = 10) {
  const [highlights, setHighlights] = useState<CatalogHighlight[]>([]);

  const load = useCallback(async () => {
    const cached = await getCachedCatalogHighlights();
    if (cached.length > 0) setHighlights(cached);

    try {
      const fresh = await fetchCatalogHighlights(limit);
      setHighlights(fresh);
    } catch (e) {
      console.log("CATALOG HIGHLIGHTS FETCH ERROR", e);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { highlights, reload: load };
}
