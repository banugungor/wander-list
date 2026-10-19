import { HeritageThumbnail } from "@/components/heritage-thumbnail";
import { ItemThumbnail } from "@/components/item-thumbnail";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import type { Language } from "@/contexts/language-context";
import { getLocalizedCountryField, getLocalizedCountryName } from "@/data/countryNamesTr";
import { findHeritageCountryToken, splitCountryField } from "@/data/heritageContinents";
import { heritageSites } from "@/data/heritageSites";
import { getLocalizedHeritageItem } from "@/data/heritageTranslations";
import { localizedEntryName } from "@/data/nameIndex";
import { matchesSearch } from "@/data/searchText";
import { findCountry, type ActivityRef, type ActivityRefCategory } from "@/data/trips";
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

type Args = {
  category: ActivityRefCategory;
  /** `worldCountries.json` id to limit the list to, or null for every country. */
  countryId: string | null;
  search: string;
  language: Language;
  /** Nothing is fetched or computed while false (picker closed). */
  enabled: boolean;
};

/** The pickable rows of one list (heritage / landmarks / cuisine / islands)
 * for the trip activity picker, optionally limited to one country and
 * filtered by name. Heritage comes from the bundled dataset; the other three
 * from the lazily-loaded names index (see data/nameIndex.ts), so they work
 * offline once it has been fetched once. With a search the best matches come
 * first (capped, like the category search screens); without one the whole
 * list is returned alphabetically. */
export function useTripActivityOptions({
  category,
  countryId,
  search,
  language,
  enabled,
}: Args): { options: ActivityOption[]; loading: boolean } {
  const isHeritage = category === "heritage";
  const { entries, loading } = useNameIndex(
    isHeritage ? "cuisine" : category,
    enabled && !isHeritage,
  );

  const options = useMemo(() => {
    if (!enabled) return [];
    const query = search.trim();
    const categoryMeta = getCategory(category);
    const country = findCountry(countryId);

    let rows: ActivityOption[];
    if (isHeritage) {
      // Heritage names its countries its own way ("Türkiye", transnational
      // sites comma-joined), so a world-map country is translated to that
      // spelling first. A country with no heritage site yields no rows.
      const token = country ? findHeritageCountryToken(country.name) : null;
      rows = heritageSites
        .filter((site) => {
          if (country && !(token && splitCountryField(site.country).includes(token))) {
            return false;
          }
          return !query || matchesSearch(query, site.name, site.nameTr ?? "");
        })
        .map((site) => ({
          key: site.id,
          ref: { category, id: site.id },
          title: getLocalizedHeritageItem(site, language).name,
          subtitle: getLocalizedCountryField(site.country, language),
          leading: <HeritageThumbnail item={site} size={44} />,
        }));
    } else {
      rows = entries
        .filter(
          (entry) =>
            (!countryId || entry.countryId === countryId) &&
            (!query || matchesSearch(query, entry.name, entry.nameTr ?? "")),
        )
        .map((entry) => {
          const entryCountry = findCountry(entry.countryId);
          return {
            key: entry.id,
            ref: { category, id: entry.id },
            title: localizedEntryName(entry, language),
            subtitle: entryCountry ? getLocalizedCountryName(entryCountry.name, language) : "",
            leading: (
              <ItemThumbnail
                imageUrl={entry.imageUrl}
                icon={categoryMeta?.icon ?? "location-outline"}
                iconColor={categoryMeta?.fg ?? palette.inkMuted}
                size={44}
              />
            ),
          };
        });
    }

    return query
      ? sortSearchMatches(rows, query, language)
      : rows.sort((a, b) => a.title.localeCompare(b.title, language));
  }, [enabled, category, isHeritage, countryId, search, language, entries]);

  return { options, loading };
}
