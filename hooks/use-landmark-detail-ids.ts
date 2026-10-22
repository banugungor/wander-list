import {
  getLandmarkDetailIdMap,
  loadLandmarkDetailIds,
  subscribeLandmarkDetailIds,
} from "@/data/landmarkDetails";
import { useEffect, useSyncExternalStore } from "react";

/** Landmark id → true for every landmark that has a detail page
 * (data/landmarkDetails.ts). Starts the (once-per-session) load on first use
 * and re-renders when it finishes. */
export function useLandmarkDetailIds(): Record<string, true> {
  useEffect(() => {
    loadLandmarkDetailIds();
  }, []);
  return useSyncExternalStore(
    subscribeLandmarkDetailIds,
    getLandmarkDetailIdMap,
    getLandmarkDetailIdMap,
  );
}
