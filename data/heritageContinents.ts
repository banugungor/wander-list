import { CONTINENT_BY_COUNTRY_ID, ContinentId } from "@/data/continents";
import worldData from "@/data/worldCountries.json";

const NAME_TO_CONTINENT: Record<string, ContinentId> = {};
for (const country of worldData.countries as { id: string; name: string }[]) {
  const continent = CONTINENT_BY_COUNTRY_ID[country.id];
  if (continent) NAME_TO_CONTINENT[country.name] = continent;
}

// heritageSites.json uses UNESCO's official country names, which don't always
// match worldCountries.json's map-label names (e.g. "Russian Federation" vs
// "Russia", "Türkiye" vs "Turkey"). These are aliased straight to a continent.
const ALIASES: Record<string, ContinentId> = {
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

/** Splits a heritage site's `country` field into individual country name
 * tokens — usually just one, but ~51 transnational sites list several
 * comma-joined names. Shared by every heritage screen that needs to bucket a
 * site under each country/continent it touches, so the delimiter/whitespace
 * handling only lives in one place. */
export function splitCountryField(countryField: string): string[] {
  return countryField
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// A transnational site (~51 of 1273) lists multiple countries in one
// comma-joined string; it's returned under every continent it touches.
export function getContinentsForCountryField(countryField: string): ContinentId[] {
  const result = new Set<ContinentId>();
  for (const token of splitCountryField(countryField)) {
    const continent = NAME_TO_CONTINENT[token] ?? ALIASES[token];
    if (continent) result.add(continent);
  }
  return [...result];
}

/** Same lookup as getContinentsForCountryField, but for a single already-split
 * country token (e.g. one side of a transnational site's comma-joined
 * field) — used by the heritage continent → country picker to bucket each
 * country name under its one continent. */
export function getContinentForCountryName(name: string): ContinentId | undefined {
  return NAME_TO_CONTINENT[name] ?? ALIASES[name];
}
