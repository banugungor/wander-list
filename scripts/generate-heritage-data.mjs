// One-off data generation script — NOT part of the app runtime.
// Fetches the full UNESCO World Heritage list and writes it as a static JSON
// bundled with the app, so the app doesn't depend on UNESCO's flaky paginated
// API at runtime. Site images are intentionally NOT resolved here — UNESCO's
// own image field is a Cloudflare-blocked document page, and bulk-resolving
// ~1300 Wikipedia thumbnails from one IP in a short burst reliably triggers
// rate limiting. Images are instead resolved lazily per-site on the device
// (see components/heritage-thumbnail.tsx), spread out over real usage.
//
// Re-run this whenever UNESCO updates its list (roughly annually):
//   node scripts/generate-heritage-data.mjs
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PAGE_LIMIT = 100;
const OUTPUT_PATH = fileURLToPath(
  new URL("../data/heritageSites.json", import.meta.url),
);

function extractLatLng(r) {
  const candidates = [r.location, r.geo_point_2d, r.coordinates, r.geo_point];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c.lat === "number" && typeof c.lon === "number") {
      return { latitude: c.lat, longitude: c.lon };
    }
    if (Array.isArray(c) && c.length === 2) {
      const [a, b] = c;
      if (typeof a === "number" && typeof b === "number") {
        return { latitude: a, longitude: b };
      }
    }
  }

  const lat = Number(r.latitude ?? r.lat);
  const lon = Number(r.longitude ?? r.lon ?? r.lng);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { latitude: lat, longitude: lon };
  }

  return {};
}

function parseRecord(r, fallbackIndex) {
  return {
    id: String(r.uuid ?? `fallback-${fallbackIndex}`),
    name: r.name_en ?? r.name_fr ?? "Unknown site",
    country: Array.isArray(r.states_names)
      ? r.states_names.join(", ")
      : (r.states_names ?? "Unknown country"),
    category:
      r.category === "Cultural" ||
      r.category === "Natural" ||
      r.category === "Mixed"
        ? r.category
        : undefined,
    description: r.short_description_en || r.description_en || undefined,
    ...extractLatLng(r),
  };
}

async function fetchAllRecords() {
  const all = [];
  let offset = 0;

  while (true) {
    const res = await fetch(
      `https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records?limit=${PAGE_LIMIT}&offset=${offset}`,
    );
    const json = await res.json();
    const results = json.results ?? [];

    all.push(
      ...results
        .map((r, index) => parseRecord(r, offset + index))
        .filter((x) => x.name.trim().length > 0),
    );

    console.log(`Fetched ${all.length}/${json.total_count} records...`);
    if (results.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }

  return all;
}

async function main() {
  console.log("Fetching UNESCO World Heritage list...");
  const records = await fetchAllRecords();
  await writeFile(OUTPUT_PATH, JSON.stringify(records));
  console.log(`Wrote ${records.length} records to ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
