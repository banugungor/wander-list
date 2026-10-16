import {
  ensureFreshNameIndex,
  getCachedNameIndex,
  type NameIndexCategory,
  type NameIndexEntry,
} from "@/data/nameIndex";
import { useEffect, useState } from "react";

/** The names-only index of a Supabase-backed category (see data/nameIndex.ts),
 * loaded only while `enabled` — i.e. once the user has actually typed a
 * search. Cache first, then one network refresh per session. `loading` is
 * true until the cache or the network has answered at least once. */
export function useNameIndex(category: NameIndexCategory, enabled: boolean) {
  const [entries, setEntries] = useState<NameIndexEntry[]>([]);
  // True once the cache or the network has answered — `loading` is derived
  // from it so the effect never has to set state synchronously.
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    getCachedNameIndex(category).then((cached) => {
      if (cached && !cancelled) {
        setEntries(cached);
        setAnswered(true);
      }
    });

    ensureFreshNameIndex(category)
      .then((fresh) => {
        if (!cancelled) setEntries(fresh);
      })
      .catch((e) => console.log("NAME INDEX FETCH ERROR", e))
      .finally(() => {
        if (!cancelled) setAnswered(true);
      });

    return () => {
      cancelled = true;
    };
  }, [category, enabled]);

  return { entries, loading: enabled && !answered };
}
