import { getHeritageSiteById, heritageSites } from "@/data/heritageSites";
import { toggleHeritageVisited } from "@/data/heritageStorage";
import { useAppStore } from "@/store/useAppStore";
import { useCallback, useMemo } from "react";

/** Drives the "World Heritage" tab of the explore screen. The site list
 * itself is a static bundled dataset (see scripts/generate-heritage-data.mjs)
 * — this hook only tracks which sites the user has marked as visited. */
export function useHeritageExplorer(enabled: boolean) {
  const visited = useAppStore((s) => s.visitedHeritage);
  const setVisited = useAppStore((s) => s.setVisitedHeritage);

  const toggle = useCallback(
    async (id: string) => {
      if (!enabled) return;
      const item = getHeritageSiteById(id) ?? undefined;
      const updated = await toggleHeritageVisited(id, item, visited);
      setVisited(updated);
    },
    [enabled, visited, setVisited],
  );

  const percent = useMemo(() => {
    const total = heritageSites.length;
    const raw = total > 0 ? Math.round((visited.length / total) * 100) : 0;
    return Math.min(100, Math.max(0, raw));
  }, [visited.length]);

  return {
    data: heritageSites,
    heritageTotal: heritageSites.length,
    percent,
    visited,
    toggle,
  };
}
