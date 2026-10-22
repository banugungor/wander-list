// Stylised vector base maps of single cities, drawn by components/trip-map.tsx
// as the background of a trip's route. Each is a row of the Supabase
// `city_maps` table (scripts/city_maps_schema.sql), generated from
// OpenStreetMap by scripts/build-city-map.mjs (rivers, water, parks, main
// roads) and downloaded on demand by data/cityMapStore.ts. OSM data is ODbL,
// so the map component always prints "© OpenStreetMap contributors". This
// file holds the types and the pure geometry; nothing here fetches.

export type LatLng = { lat: number; lng: number };

/** Geographic frame a city map's paths were generated for. */
export type CityMapBbox = { south: number; west: number; north: number; east: number };

/** What the app knows of every city map before downloading any of them:
 * where it is (to pick the one a trip's stops fall in) and a version, so a
 * cached copy is reused until the row changes. */
export type CityMapIndexEntry = { bbox: CityMapBbox; updatedAt: string };

export type CityMap = {
  id: string;
  name: string;
  nameTr: string;
  bbox: CityMapBbox;
  /** Size of the path coordinate space ("map units"). */
  width: number;
  height: number;
  /** A text label in map units; `kind` picks its colour. */
  labels: { text: string; textTr: string; x: number; y: number; kind: "water" }[];
  /** SVG path data, one string per layer (many subpaths each). */
  water: string;
  green: string;
  rivers: string;
  canals: string;
  minor: string;
  major: string;
};

export type MapPoint = { x: number; y: number };

/** Lat/lng → map units. Must match makeProjector() in
 * scripts/build-city-map.mjs: equirectangular, x scaled by cos(mid-latitude),
 * north-up. Not clamped — see isInsideMap. */
export function projectToMap(map: CityMap, { lat, lng }: LatLng): MapPoint {
  const { south, west, north, east } = map.bbox;
  const cosLat = Math.cos((((south + north) / 2) * Math.PI) / 180);
  const k = map.width / ((east - west) * cosLat);
  return { x: (lng - west) * cosLat * k, y: (north - lat) * k };
}

export function isInsideMap(map: { bbox: CityMapBbox }, { lat, lng }: LatLng): boolean {
  const { south, west, north, east } = map.bbox;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

/** The id of the city map (of those in `index`) that contains the most of
 * `points`, or null when none contains any. A trip isn't tied to one city, so
 * the map is chosen from where its stops actually are. */
export function pickCityMap(
  points: LatLng[],
  index: Record<string, CityMapIndexEntry>,
): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const [id, entry] of Object.entries(index)) {
    const count = points.filter((point) => isInsideMap(entry, point)).length;
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

export type ViewBox = { x: number; y: number; width: number; height: number };

// Never zoom closer than this many map units across (about 2 km in Rome), so
// one or two stops show a neighbourhood instead of a single street.
const MIN_VIEW_SPAN = 220;
const VIEW_PADDING = 0.2;

/** The part of the map to show: the stops' bounding box plus padding, grown
 * to `aspect` (width / height) and kept inside the map where it fits. With no
 * points it is the whole map. */
export function fitViewBox(map: CityMap, points: MapPoint[], aspect: number): ViewBox {
  if (points.length === 0) {
    return growToAspect({ x: 0, y: 0, width: map.width, height: map.height }, aspect, map);
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = Math.max(maxX - minX, 1) * (1 + VIEW_PADDING * 2);
  const height = Math.max(maxY - minY, 1) * (1 + VIEW_PADDING * 2);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const box = {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
  return growToAspect(box, aspect, map);
}

function growToAspect(box: ViewBox, aspect: number, map: CityMap): ViewBox {
  let { width, height } = box;
  const centerX = box.x + width / 2;
  const centerY = box.y + height / 2;

  width = Math.max(width, MIN_VIEW_SPAN);
  height = Math.max(height, MIN_VIEW_SPAN / aspect);
  if (width / height < aspect) width = height * aspect;
  else height = width / aspect;

  // Wider than the whole map: show all of it rather than blank margins.
  if (width > map.width) {
    width = map.width;
    height = width / aspect;
  }
  if (height > map.height) {
    height = map.height;
    width = height * aspect;
  }

  const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);
  return {
    x: clamp(centerX - width / 2, map.width - width),
    y: clamp(centerY - height / 2, map.height - height),
    width,
    height,
  };
}
