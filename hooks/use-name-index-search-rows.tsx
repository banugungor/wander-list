import type { ItemSearchRow } from "@/components/item-search-row";
import { ItemThumbnail } from "@/components/item-thumbnail";
import { palette } from "@/constants/palette";
import type { Language } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import {
  localizedEntryName,
  type NameIndexCategory,
  type NameIndexEntry,
} from "@/data/nameIndex";
import { matchesSearch, normalizeSearchText } from "@/data/searchText";
import worldData from "@/data/worldCountries.json";
import { useNameIndex } from "@/hooks/use-name-index";
import type { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";

// A broad query ("a") would otherwise render thousands of rows.
export const MAX_ITEM_SEARCH_RESULTS = 60;

// Fallback tile for an item without a photo — same icons/colors as the
// category's own list rows (EntryListRow call sites).
const FALLBACK_ICON: Record<
  NameIndexCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  cuisine: { icon: "restaurant-outline", color: palette.coralText },
  islands: { icon: "boat-outline", color: palette.violetText },
  landmarks: { icon: "trail-sign-outline", color: palette.amberText },
};

const COUNTRY_BY_ID = new Map(worldData.countries.map((c) => [c.id, c]));

/** Orders matches so names that *start with* the query come first, then
 * alphabetically — shared by every item search (heritage included). */
export function sortSearchMatches<T extends { title: string }>(
  matches: T[],
  search: string,
  language: Language,
): T[] {
  const q = normalizeSearchText(search.trim());
  const startsWith = (title: string) => normalizeSearchText(title).startsWith(q);
  return matches
    .sort((a, b) => {
      const aStarts = startsWith(a.title);
      if (aStarts !== startsWith(b.title)) return aStarts ? -1 : 1;
      return a.title.localeCompare(b.title, language);
    })
    .slice(0, MAX_ITEM_SEARCH_RESULTS);
}

type Args = {
  category: NameIndexCategory;
  search: string;
  language: Language;
  /** Limit matches to one country (the landmarks country screen). */
  countryId?: string;
  /** Overrides the row's subtitle (default: the country name) — e.g. the
   * city name on a country screen. */
  subtitleFor?: (entry: NameIndexEntry) => string;
};

/** Search-result rows for individual dishes/islands/landmarks, matched by
 * name (English or Turkish) against the lazily-loaded names index. Tapping a
 * row opens the screen that lists the item — the country (city, for
 * landmarks) — with the search box pre-filled with its name, so the item is
 * right there with its visited toggle. Empty while `search` is blank. */
export function useNameIndexSearchRows({
  category,
  search,
  language,
  countryId,
  subtitleFor,
}: Args): { rows: ItemSearchRow[]; loading: boolean } {
  const enabled = search.trim().length > 0;
  const { entries, loading } = useNameIndex(category, enabled);

  const rows = useMemo(() => {
    if (!enabled) return [];
    const matches = entries
      .filter(
        (e) =>
          (!countryId || e.countryId === countryId) &&
          matchesSearch(search, e.name, e.nameTr ?? ""),
      )
      .map((entry) => ({ entry, title: localizedEntryName(entry, language) }));

    return sortSearchMatches(matches, search, language).map(({ entry, title }) => {
      const country = COUNTRY_BY_ID.get(entry.countryId);
      const base =
        category === "landmarks" && entry.cityId
          ? `/landmarks/${entry.countryId}/${entry.cityId}`
          : `/${category}/${entry.countryId}`;
      return {
        key: entry.id,
        title,
        subtitle:
          subtitleFor?.(entry) ??
          (country ? getLocalizedCountryName(country.name, language) : ""),
        leading: (
          <ItemThumbnail
            imageUrl={entry.imageUrl}
            icon={FALLBACK_ICON[category].icon}
            iconColor={FALLBACK_ICON[category].color}
            size={44}
          />
        ),
        onPress: () =>
          router.push(`${base}?q=${encodeURIComponent(title)}` as never),
      };
    });
  }, [enabled, entries, search, language, countryId, category, subtitleFor]);

  return { rows, loading };
}
