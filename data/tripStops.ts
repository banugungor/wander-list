import { isInsideMap, type CityMap, type LatLng } from "@/data/cityMaps";
import { getHeritageSiteById } from "@/data/heritageSites";
import type { TripDay } from "@/data/trips";

/** One activity of a trip that has a position on the map. */
export type TripStop = {
  /** The activity's id — unique within the trip. */
  key: string;
  /** Index into `trip.days`. */
  dayIndex: number;
  name: string;
  category: "heritage" | "landmarks";
  /** The picked item's id in its list — with `category`, the key of its map icon. */
  refId: string;
  position: LatLng;
};

/** Where an activity picked from a list sits on the map: landmarks via the
 * `landmarks.lat/lng` columns (data/landmarkCoords.ts), heritage sites via the
 * coordinates already bundled on each site. Hand-typed activities, dishes and
 * islands have none, so they never appear on the map. */
function positionOf(
  ref: NonNullable<TripDay["activities"][number]["ref"]>,
  landmarkCoords: Record<string, LatLng>,
): LatLng | null {
  if (ref.category === "landmarks") return landmarkCoords[ref.id] ?? null;
  if (ref.category === "heritage") {
    const site = getHeritageSiteById(ref.id);
    if (site && typeof site.latitude === "number" && typeof site.longitude === "number") {
      return { lat: site.latitude, lng: site.longitude };
    }
  }
  return null;
}

/** Every mappable activity of the trip, in day then activity order. */
export function collectTripStops(
  days: TripDay[],
  landmarkCoords: Record<string, LatLng>,
): TripStop[] {
  const stops: TripStop[] = [];
  days.forEach((day, dayIndex) => {
    for (const activity of day.activities) {
      const ref = activity.ref;
      if (!ref || (ref.category !== "landmarks" && ref.category !== "heritage")) continue;
      const position = positionOf(ref, landmarkCoords);
      if (!position) continue;
      stops.push({
        key: activity.id,
        dayIndex,
        name: activity.text,
        category: ref.category,
        refId: ref.id,
        position,
      });
    }
  });
  return stops;
}

/** Splits stops into those that fall on `map` and the number that don't (a
 * day trip to Ostia from a Rome trip, say). */
export function splitByMap(
  stops: TripStop[],
  map: CityMap,
): { onMap: TripStop[]; outsideCount: number } {
  const onMap = stops.filter((stop) => isInsideMap(map, stop.position));
  return { onMap, outsideCount: stops.length - onMap.length };
}
