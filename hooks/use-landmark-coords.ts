import type { LatLng } from "@/data/cityMaps";
import {
  getLandmarkCoordMap,
  loadLandmarkCoords,
  subscribeLandmarkCoords,
} from "@/data/landmarkCoords";
import { useEffect, useSyncExternalStore } from "react";

/** Landmark id → position for every landmark that has coordinates
 * (data/landmarkCoords.ts). Starts the (once-per-session) load on first use
 * and re-renders when it finishes. */
export function useLandmarkCoords(): Record<string, LatLng> {
  useEffect(() => {
    loadLandmarkCoords();
  }, []);
  return useSyncExternalStore(
    subscribeLandmarkCoords,
    getLandmarkCoordMap,
    getLandmarkCoordMap,
  );
}
