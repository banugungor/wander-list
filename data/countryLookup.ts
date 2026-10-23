import worldData from "@/data/worldCountries.json";

export type WorldCountry = { id: string; name: string; iso2?: string };

const COUNTRY_BY_ID = new Map<string, WorldCountry>(
  (worldData.countries as WorldCountry[]).map((c) => [c.id, c]),
);

/** A `worldCountries.json` entry by its id ("792"), or undefined if unknown. */
export function getWorldCountry(id: string): WorldCountry | undefined {
  return COUNTRY_BY_ID.get(id);
}
