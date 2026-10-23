import { getWorldCountry, type WorldCountry } from "@/data/countryLookup";
import type { CountryYears } from "@/data/profileExtras";

export type YearGroup = { year: number; countries: WorldCountry[] };

export type TravelTimeline = {
  /** Newest year first. */
  years: YearGroup[];
  /** Visited countries the user hasn't given a year yet. */
  undated: WorldCountry[];
};

/** Groups visited countries by the year(s) the user said they went. Within a year
 * (and in `undated`) the newest-marked country comes first — `visitedIds` is in
 * marking order, oldest first. Ids that aren't in `worldCountries.json` are
 * skipped. Shared by the profile timeline and the year share card. */
export function buildTravelTimeline(
  visitedIds: string[],
  years: CountryYears,
): TravelTimeline {
  const byYear = new Map<number, WorldCountry[]>();
  const undated: WorldCountry[] = [];

  for (let i = visitedIds.length - 1; i >= 0; i--) {
    const country = getWorldCountry(visitedIds[i]);
    if (!country) continue;
    const visitYears = years[country.id];
    if (!visitYears || visitYears.length === 0) {
      undated.push(country);
      continue;
    }
    // A country visited in several years shows up under each of them.
    for (const year of visitYears) {
      const list = byYear.get(year);
      if (list) list.push(country);
      else byYear.set(year, [country]);
    }
  }

  return {
    years: [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, countries]) => ({ year, countries })),
    undated,
  };
}
