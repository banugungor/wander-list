// Dev tool — NOT part of the app runtime.
// data/heritageSites.json has ~1270 entries and is impractical to eyeball for
// "how much is translated" / "what's next". This reports progress overall and
// per continent, and can list the next untranslated entries to work on, so
// the single big file stays manageable without splitting it.
//
// Usage (--no-warnings silences Node's "Type Stripping is experimental" notice
// from the data/continents.ts import below):
//   node --no-warnings scripts/heritage-translation-status.mjs
//   node --no-warnings scripts/heritage-translation-status.mjs --next 30
//   node --no-warnings scripts/heritage-translation-status.mjs --next 30 asia
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SITES_PATH = fileURLToPath(
  new URL("../data/heritageSites.json", import.meta.url),
);

// Mirrors data/heritageContinents.ts's ALIASES table (kept in sync by hand —
// this is a read-only reporting script, not app runtime, so duplicating this
// small lookup here is cheaper than teaching this plain Node script to
// resolve the app's "@/" TS path alias).
const ALIASES = {
  "Antigua and Barbuda": "north_america",
  "Bolivia (Plurinational State of)": "south_america",
  "Bosnia and Herzegovina": "europe",
  "Central African Republic": "africa",
  "Democratic People's Republic of Korea": "asia",
  "Democratic Republic of the Congo": "africa",
  "Dominican Republic": "north_america",
  "Holy See": "europe",
  "Iran (Islamic Republic of)": "asia",
  "Jerusalem (Site proposed by Jordan)": "asia",
  "Lao People's Democratic Republic": "asia",
  "Marshall Islands": "oceania",
  "Micronesia (Federated States of)": "oceania",
  "Netherlands (Kingdom of the)": "europe",
  "North Macedonia": "europe",
  "Republic of Korea": "asia",
  "Republic of Moldova": "europe",
  "Russian Federation": "europe",
  "Saint Kitts and Nevis": "north_america",
  "Sao Tome and Principe": "africa",
  "Solomon Islands": "oceania",
  "South Sudan": "africa",
  "State of Palestine": "asia",
  "Syrian Arab Republic": "asia",
  Türkiye: "asia",
  "United Kingdom of Great Britain and Northern Ireland": "europe",
  "United Republic of Tanzania": "africa",
  "Venezuela (Bolivarian Republic of)": "south_america",
  "Viet Nam": "asia",
};

const CONTINENT_LABELS = {
  africa: "Africa",
  asia: "Asia",
  europe: "Europe",
  north_america: "North America",
  south_america: "South America",
  oceania: "Oceania",
  unknown: "(unrecognized country name)",
};

async function buildNameToContinent() {
  const { CONTINENT_BY_COUNTRY_ID } = await import("../data/continents.ts");
  const worldData = JSON.parse(
    await readFile(
      fileURLToPath(new URL("../data/worldCountries.json", import.meta.url)),
      "utf8",
    ),
  );
  const nameToContinent = {};
  for (const country of worldData.countries) {
    const continent = CONTINENT_BY_COUNTRY_ID[country.id];
    if (continent) nameToContinent[country.name] = continent;
  }
  return nameToContinent;
}

function getContinentsForCountryField(countryField, nameToContinent) {
  const tokens = countryField
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = new Set();
  for (const token of tokens) {
    const continent = nameToContinent[token] ?? ALIASES[token];
    result.add(continent ?? "unknown");
  }
  return [...result];
}

function isTranslated(site) {
  return Boolean(site.nameTr || site.descriptionTr);
}

async function main() {
  const args = process.argv.slice(2);
  const nextIdx = args.indexOf("--next");
  const nextCount = nextIdx !== -1 ? Number(args[nextIdx + 1]) || 30 : null;
  const continentFilter =
    nextIdx !== -1 && args[nextIdx + 2] && !args[nextIdx + 2].startsWith("--")
      ? args[nextIdx + 2].toLowerCase()
      : null;

  const sites = JSON.parse(await readFile(SITES_PATH, "utf8"));
  const nameToContinent = await buildNameToContinent();

  const perContinent = {};
  for (const key of [...Object.keys(CONTINENT_LABELS)]) {
    perContinent[key] = { total: 0, translated: 0 };
  }

  const enriched = sites.map((site, index) => {
    const continents = getContinentsForCountryField(
      site.country,
      nameToContinent,
    );
    const translated = isTranslated(site);
    for (const c of continents) {
      perContinent[c].total += 1;
      if (translated) perContinent[c].translated += 1;
    }
    return { index, site, continents, translated };
  });

  if (nextCount !== null) {
    const untranslated = enriched.filter((e) => {
      if (e.translated) return false;
      if (continentFilter) return e.continents.includes(continentFilter);
      return true;
    });
    const batch = untranslated.slice(0, nextCount);
    console.log(
      `Next ${batch.length} untranslated${continentFilter ? ` (${continentFilter})` : ""} of ${untranslated.length} remaining:\n`,
    );
    for (const { index, site } of batch) {
      console.log(`${index}\t${site.id}\t${site.country}\t${site.name}`);
    }
    return;
  }

  const totalTranslated = sites.filter(isTranslated).length;
  console.log(
    `Heritage translations: ${totalTranslated}/${sites.length} (${((totalTranslated / sites.length) * 100).toFixed(1)}%) done\n`,
  );
  console.log("By continent (transnational sites count under every continent they touch):");
  for (const [key, label] of Object.entries(CONTINENT_LABELS)) {
    const { total, translated } = perContinent[key];
    if (total === 0) continue;
    const pct = ((translated / total) * 100).toFixed(1);
    console.log(`  ${label.padEnd(24)} ${String(translated).padStart(4)}/${String(total).padEnd(5)} (${pct}%)`);
  }
}

main();
