// Build step — NOT part of the app runtime.
// Turns OpenStreetMap data for one city into the small, stylable vector
// base map that components/trip-map.tsx draws (rivers, water, parks, main
// roads as pre-simplified SVG path strings), written to
// assets/citymaps/<id>.json. The data is ODbL — the app shows a visible
// "© OpenStreetMap contributors" line wherever the map is drawn.
//
// Usage:
//   node scripts/build-city-map.mjs rome
//   OSM_JSON=/path/to/overpass-response.json node scripts/build-city-map.mjs rome
// (OSM_JSON skips the Overpass request and reuses a saved response.)
//
// To add a city: add an entry to CITY_MAPS below, run this, then register
// the generated file in data/cityMaps.ts.
//
// The projection here MUST match projectToMap() in data/cityMaps.ts:
// equirectangular, x scaled by cos(mid-latitude), north-up.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const CITY_MAPS = {
  rome: {
    name: "Rome",
    nameTr: "Roma",
    // Central Rome plus Vatican City, Appian Way / San Callisto catacombs
    // and St. Paul Outside the Walls to the south. Ostia Antica is far
    // outside this frame on purpose — a stop outside the frame is simply
    // not drawn (see data/cityMaps.ts).
    bbox: { south: 41.825, west: 12.435, north: 41.925, east: 12.545 },
    width: 1000,
    labels: [{ text: "Tevere", textTr: "Tiber", lat: 41.9085, lng: 12.4795, kind: "water" }],
  },
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
// Clip lines/polygons to the frame plus a margin so nothing off-screen
// inflates the file; the SVG viewBox crops the margin anyway.
const MARGIN = 0.04;
const SIMPLIFY_EPSILON = 1.1; // map units (width is 1000)
const MIN_POLYGON_AREA = 150; // map units², drops specks
const COORD_DECIMALS = 1;

const ROAD_CLASS = {
  motorway: "major",
  trunk: "major",
  primary: "major",
  secondary: "minor",
};

function overpassQuery({ south, west, north, east }) {
  const b = `${south - 0.01},${west - 0.01},${north + 0.01},${east + 0.01}`;
  return `[out:json][timeout:120];
(
  way["waterway"~"^(river|canal)$"](${b});
  way["natural"="water"](${b});
  relation["natural"="water"](${b});
  way["leisure"~"^(park|garden)$"](${b});
  relation["leisure"~"^(park|garden)$"](${b});
  way["landuse"~"^(grass|forest|recreation_ground)$"](${b});
  way["highway"~"^(motorway|trunk|primary|secondary)$"](${b});
);
out geom;`;
}

async function loadOsm(config) {
  if (process.env.OSM_JSON) {
    return JSON.parse(await readFile(process.env.OSM_JSON, "utf8"));
  }
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "User-Agent": "WanderlistCityMapBuilder/1.0" },
    body: new URLSearchParams({ data: overpassQuery(config.bbox) }),
  });
  if (!response.ok) throw new Error(`Overpass ${response.status}`);
  return response.json();
}

function makeProjector({ south, west, north, east }, width) {
  const cosLat = Math.cos((((south + north) / 2) * Math.PI) / 180);
  const k = width / ((east - west) * cosLat);
  return {
    height: (north - south) * k,
    project: (lat, lng) => [(lng - west) * cosLat * k, (north - lat) * k],
  };
}

// Ramer–Douglas–Peucker.
function simplify(points, epsilon) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy);
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const distance =
      length === 0
        ? Math.hypot(px - ax, py - ay)
        : Math.abs(dy * px - dx * py + bx * ay - by * ax) / length;
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  if (maxDistance <= epsilon) return [points[0], points[points.length - 1]];
  const left = simplify(points.slice(0, index + 1), epsilon);
  const right = simplify(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

const round = (n) => n.toFixed(COORD_DECIMALS).replace(/\.0$/, "");

function toPath(points, closed) {
  const [first, ...rest] = points;
  let d = `M${round(first[0])} ${round(first[1])}`;
  for (const [x, y] of rest) d += `L${round(x)} ${round(y)}`;
  return closed ? `${d}Z` : d;
}

// Splits a polyline into the runs that fall inside the (margin-expanded)
// frame, so a long road leaving the city doesn't carry points nobody sees.
function clipRuns(points, frame) {
  const runs = [];
  let current = [];
  for (const point of points) {
    const inside =
      point[0] >= frame.minX && point[0] <= frame.maxX &&
      point[1] >= frame.minY && point[1] <= frame.maxY;
    if (inside) {
      current.push(point);
    } else if (current.length) {
      runs.push(current);
      current = [];
    }
  }
  if (current.length) runs.push(current);
  return runs.filter((run) => run.length >= 2);
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Joins a relation's outer member ways into closed rings by matching end
// points (OSM splits big multipolygon outlines across several ways).
function stitchRings(wayGeometries) {
  const pending = wayGeometries.map((g) => g.slice());
  const rings = [];
  const same = (a, b) => a.lat === b.lat && a.lon === b.lon;
  while (pending.length) {
    let ring = pending.pop();
    let extended = true;
    while (extended && !same(ring[0], ring[ring.length - 1])) {
      extended = false;
      for (let i = 0; i < pending.length; i++) {
        const way = pending[i];
        const end = ring[ring.length - 1];
        if (same(way[0], end)) ring = ring.concat(way.slice(1));
        else if (same(way[way.length - 1], end)) ring = ring.concat(way.slice(0, -1).reverse());
        else continue;
        pending.splice(i, 1);
        extended = true;
        break;
      }
    }
    if (same(ring[0], ring[ring.length - 1]) && ring.length >= 4) rings.push(ring);
  }
  return rings;
}

async function main() {
  const id = process.argv[2];
  const config = CITY_MAPS[id];
  if (!config) {
    console.error(`Usage: node scripts/build-city-map.mjs <${Object.keys(CITY_MAPS).join("|")}>`);
    process.exit(1);
  }

  const osm = await loadOsm(config);
  const { height, project } = makeProjector(config.bbox, config.width);
  const frame = {
    minX: -config.width * MARGIN,
    maxX: config.width * (1 + MARGIN),
    minY: -height * MARGIN,
    maxY: height * (1 + MARGIN),
  };
  const toPoints = (geometry) => geometry.map((p) => project(p.lat, p.lon));

  const layers = { rivers: [], canals: [], water: [], green: [], major: [], minor: [] };

  const addLine = (layer, geometry) => {
    for (const run of clipRuns(toPoints(geometry), frame)) {
      layers[layer].push(toPath(simplify(run, SIMPLIFY_EPSILON), false));
    }
  };
  const addPolygon = (layer, geometry) => {
    const points = toPoints(geometry).map(([x, y]) => [
      clamp(x, frame.minX, frame.maxX),
      clamp(y, frame.minY, frame.maxY),
    ]);
    const simplified = simplify(points, SIMPLIFY_EPSILON);
    if (simplified.length < 4 || polygonArea(simplified) < MIN_POLYGON_AREA) return;
    layers[layer].push(toPath(simplified, true));
  };

  for (const element of osm.elements) {
    const tags = element.tags ?? {};
    const isWater = tags.natural === "water";
    const isGreen =
      tags.leisure === "park" || tags.leisure === "garden" || Boolean(tags.landuse);
    const polygonLayer = isWater ? "water" : isGreen ? "green" : null;

    if (element.type === "way" && element.geometry) {
      if (tags.waterway === "river") addLine("rivers", element.geometry);
      else if (tags.waterway === "canal") addLine("canals", element.geometry);
      else if (ROAD_CLASS[tags.highway]) addLine(ROAD_CLASS[tags.highway], element.geometry);
      else if (polygonLayer) {
        const first = element.geometry[0];
        const last = element.geometry[element.geometry.length - 1];
        if (first.lat === last.lat && first.lon === last.lon) {
          addPolygon(polygonLayer, element.geometry);
        }
      }
    } else if (element.type === "relation" && polygonLayer) {
      const outers = (element.members ?? [])
        .filter((m) => m.type === "way" && m.role === "outer" && m.geometry)
        .map((m) => m.geometry);
      for (const ring of stitchRings(outers)) addPolygon(polygonLayer, ring);
    }
  }

  const labels = config.labels.map(({ lat, lng, ...rest }) => {
    const [x, y] = project(lat, lng);
    return { ...rest, x: Number(round(x)), y: Number(round(y)) };
  });

  const output = {
    id,
    name: config.name,
    nameTr: config.nameTr,
    bbox: config.bbox,
    width: config.width,
    height: Number(round(height)),
    labels,
    // One path string per layer (many subpaths) keeps the render cheap.
    water: layers.water.join(""),
    green: layers.green.join(""),
    rivers: layers.rivers.join(""),
    canals: layers.canals.join(""),
    minor: layers.minor.join(""),
    major: layers.major.join(""),
  };

  const outputPath = fileURLToPath(new URL(`../assets/citymaps/${id}.json`, import.meta.url));
  await mkdir(fileURLToPath(new URL("../assets/citymaps/", import.meta.url)), { recursive: true });
  const text = JSON.stringify(output);
  await writeFile(outputPath, text);

  const sizes = Object.entries(layers).map(([name, paths]) => `${name} ${paths.length}`);
  console.log(`${id}: ${(text.length / 1024).toFixed(0)}KB  (${sizes.join(", ")})`);
}

main();
