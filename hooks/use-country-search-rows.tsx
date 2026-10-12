import { CountryFlag } from "@/components/country-flag";
import type { CountrySearchRow } from "@/components/country-search-results";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { matchesSearch } from "@/data/searchText";
import worldData from "@/data/worldCountries.json";
import type { Language } from "@/contexts/language-context";
import { router } from "expo-router";
import { useMemo } from "react";

type Args = {
  search: string;
  language: Language;
  /** country id -> total items in the category */
  totals: Record<string, number>;
  /** country id -> visited/tasted items in the category */
  done: Record<string, number>;
  /** Route prefix; a row opens `/${routeBase}/${countryId}`. */
  routeBase: string;
};

/** Rows for `CountrySearchResults` on the id-keyed pickers (cuisine, islands,
 * landmarks): every country with content whose English or localized name
 * matches `search`, across all continents, sorted by localized name. Empty
 * while `search` is blank. */
export function useCountrySearchRows({
  search,
  language,
  totals,
  done,
  routeBase,
}: Args): CountrySearchRow[] {
  return useMemo(() => {
    if (!search.trim()) return [];
    return worldData.countries
      .filter(
        (c) =>
          (totals[c.id] ?? 0) > 0 &&
          matchesSearch(search, c.name, getLocalizedCountryName(c.name, language)),
      )
      .sort((a, b) =>
        getLocalizedCountryName(a.name, language).localeCompare(
          getLocalizedCountryName(b.name, language),
          language,
        ),
      )
      .map((c) => ({
        key: c.id,
        title: getLocalizedCountryName(c.name, language),
        leading: <CountryFlag id={c.id} iso2={c.iso2} size={20} />,
        done: done[c.id] ?? 0,
        total: totals[c.id] ?? 0,
        onPress: () => router.push(`/${routeBase}/${c.id}` as never),
      }));
  }, [search, language, totals, done, routeBase]);
}
