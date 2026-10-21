import { HeritageThumbnail } from "@/components/heritage-thumbnail";
import { ItemThumbnail } from "@/components/item-thumbnail";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import type { Language } from "@/contexts/language-context";
import { localizedCityName } from "@/data/cities";
import { getLocalizedCityName } from "@/data/cityNamesTr";
import { getLocalizedCountryField, getLocalizedCountryName } from "@/data/countryNamesTr";
import { findHeritageCountryToken, splitCountryField } from "@/data/heritageContinents";
import { heritageSites } from "@/data/heritageSites";
import { getLocalizedHeritageItem } from "@/data/heritageTranslations";
import { localizedEntryName } from "@/data/nameIndex";
import { matchesSearch, normalizeSearchText } from "@/data/searchText";
import { findCountry, type ActivityRef, type ActivityRefCategory } from "@/data/trips";
import { useCityIndex } from "@/hooks/use-city-index";
import { useNameIndex } from "@/hooks/use-name-index";
import { sortSearchMatches } from "@/hooks/use-name-index-search-rows";
import type { ReactNode } from "react";
import { useMemo } from "react";

export type ActivityOption = {
  key: string;
  ref: ActivityRef;
  title: string;
  subtitle: string;
  leading: ReactNode;
};

/** A city the current list has items in, for the picker's city filter. */
export type CityFilterOption = { key: string; label: string; count: number };

type Args = {
  category: ActivityRefCategory;
  /** `worldCountries.json` id to limit the list to, or null for every country. */
  countryId: string | null;
  /** `CityFilterOption.key` to limit the list to, or null for every city. Only
   * applies while a country is chosen and the list actually has that city —
   * otherwise it is ignored (see `activeCityKey`). */
  cityKey: string | null;
  search: string;
  language: Language;
  /** Nothing is fetched or computed while false (picker closed). */
  enabled: boolean;
};

type Row = {
  option: ActivityOption;
  /** English city name, null when the item has none. */
  city: string | null;
  cityLabel: string | null;
  /** Extra names the search box matches besides the title. */
  searchNames: string[];
};

// One key per city across lists: heritage stores the city as English text and
// landmarks as a `cities` row, so both are compared by their normalised
// English name (accents and case ignored — "Pecs" finds "Pécs").
const cityKeyOf = (englishName: string) => normalizeSearchText(englishName);

/** The pickable rows of one list (heritage / landmarks / cuisine / islands)
 * for the trip activity picker, optionally limited to one country (and, for
 * heritage and landmarks, one city of it) and filtered by name. Heritage comes
 * from the bundled dataset; the other three from the lazily-loaded names index
 * (see data/nameIndex.ts), so they work offline once it has been fetched
 * once. With a search the best matches come first (capped, like the category
 * search screens); without one the whole list is returned alphabetically.
 *
 * Heritage and landmarks rows show their city as the subtitle ("Florence",
 * or "Florence · Italy" when no country is chosen) and the search also
 * matches the city name. `cities` is every city that has an item in the
 * chosen country's list — the data for the picker's city filter; empty for
 * cuisine/islands (they have no city) and while no country is chosen. */
export function useTripActivityOptions({
  category,
  countryId,
  cityKey,
  search,
  language,
  enabled,
}: Args): {
  options: ActivityOption[];
  cities: CityFilterOption[];
  /** `cityKey` if it is in `cities`, else null. */
  activeCityKey: string | null;
  loading: boolean;
} {
  const isHeritage = category === "heritage";
  const isLandmarks = category === "landmarks";
  const { entries, loading } = useNameIndex(
    isHeritage ? "cuisine" : category,
    enabled && !isHeritage,
  );
  const { byId: citiesById } = useCityIndex(enabled && isLandmarks);

  // Rows of the chosen country (before the city and name filters), so the
  // city list doesn't shrink as the user types.
  const rows = useMemo<Row[]>(() => {
    if (!enabled) return [];
    const categoryMeta = getCategory(category);
    const country = findCountry(countryId);

    // With no country chosen the row says which country it is in too.
    const withCountry = (label: string | null, countryName: string) =>
      country ? (label ?? countryName) : [label, countryName].filter(Boolean).join(" · ");

    if (isHeritage) {
      // Heritage names its countries its own way ("Türkiye", transnational
      // sites comma-joined), so a world-map country is translated to that
      // spelling first. A country with no heritage site yields no rows.
      const token = country ? findHeritageCountryToken(country.name) : null;
      return heritageSites
        .filter((site) => !country || (token && splitCountryField(site.country).includes(token)))
        .map((site) => {
          const cityLabel = site.city ? getLocalizedCityName(site.city, language) : null;
          const item = getLocalizedHeritageItem(site, language);
          return {
            option: {
              key: site.id,
              ref: { category, id: site.id },
              title: item.name,
              subtitle: withCountry(cityLabel, getLocalizedCountryField(site.country, language)),
              leading: <HeritageThumbnail item={site} size={44} />,
            },
            city: site.city ?? null,
            cityLabel,
            searchNames: [site.name, site.nameTr ?? "", site.city ?? "", cityLabel ?? ""],
          };
        });
    }

    return entries
      .filter((entry) => !countryId || entry.countryId === countryId)
      .map((entry) => {
        const entryCountry = findCountry(entry.countryId);
        const cityRecord = entry.cityId ? citiesById[entry.cityId] : undefined;
        const cityLabel = cityRecord ? localizedCityName(cityRecord, language) : null;
        return {
          option: {
            key: entry.id,
            ref: { category, id: entry.id },
            title: localizedEntryName(entry, language),
            subtitle: withCountry(
              cityLabel,
              entryCountry ? getLocalizedCountryName(entryCountry.name, language) : "",
            ),
            leading: (
              <ItemThumbnail
                imageUrl={entry.imageUrl}
                icon={categoryMeta?.icon ?? "location-outline"}
                iconColor={categoryMeta?.fg ?? palette.inkMuted}
                size={44}
              />
            ),
          },
          city: cityRecord?.name ?? null,
          cityLabel,
          searchNames: [entry.name, entry.nameTr ?? "", cityRecord?.name ?? "", cityLabel ?? ""],
        };
      });
  }, [enabled, category, isHeritage, countryId, language, entries, citiesById]);

  const cities = useMemo<CityFilterOption[]>(() => {
    if (!countryId) return [];
    const byKey = new Map<string, CityFilterOption>();
    for (const row of rows) {
      if (!row.city || !row.cityLabel) continue;
      const key = cityKeyOf(row.city);
      const existing = byKey.get(key);
      if (existing) existing.count += 1;
      else byKey.set(key, { key, label: row.cityLabel, count: 1 });
    }
    return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label, language));
  }, [rows, countryId, language]);

  const activeCityKey = cityKey && cities.some((city) => city.key === cityKey) ? cityKey : null;

  const options = useMemo(() => {
    const query = search.trim();
    const shown = rows
      .filter((row) => !activeCityKey || (row.city && cityKeyOf(row.city) === activeCityKey))
      .filter((row) => !query || matchesSearch(query, ...row.searchNames))
      .map((row) => row.option);

    return query
      ? sortSearchMatches(shown, query, language)
      : shown.sort((a, b) => a.title.localeCompare(b.title, language));
  }, [rows, activeCityKey, search, language]);

  return { options, cities, activeCityKey, loading };
}
