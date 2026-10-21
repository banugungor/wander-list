import { getMapIconMap, loadMapIcons, subscribeMapIcons } from "@/data/mapIcons";
import { useEffect, useSyncExternalStore } from "react";

/** `mapIconKey` → icon URL for every place that has a map icon
 * (data/mapIcons.ts). Starts the (once-per-session) load on first use and
 * re-renders when it finishes. */
export function useMapIcons(): Record<string, string> {
  useEffect(() => {
    loadMapIcons();
  }, []);
  return useSyncExternalStore(subscribeMapIcons, getMapIconMap, getMapIconMap);
}
