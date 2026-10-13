import { CountrySearchResults } from "@/components/country-search-results";
import { ProgressCard } from "@/components/progress-card";
import { ProgressRow } from "@/components/progress-row";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { SuggestionEntry } from "@/components/suggestion-entry";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { CONTINENT_BY_COUNTRY_ID, CONTINENTS } from "@/data/continents";
import { visitedCountByCountry } from "@/data/landmarks";
import worldData from "@/data/worldCountries.json";
import { useLandmarksIndex } from "@/hooks/use-landmarks-index";
import { useLandmarksVisited } from "@/hooks/use-landmarks-visited";
import { useCountrySearchRows } from "@/hooks/use-country-search-rows";
import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

export default function LandmarksContinentPickerScreen() {
  const { t, language } = useLanguage();
  const categoryMeta = getCategory("landmarks");
  const [search, setSearch] = useState("");

  const [visited] = useLandmarksVisited();
  const { countByCountry, countryByLandmarkId, loading } = useLandmarksIndex();
  const visitedByCountry = useMemo(
    () => visitedCountByCountry(visited, countryByLandmarkId),
    [visited, countryByLandmarkId],
  );

  const countryIdsByContinent = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const country of worldData.countries) {
      const continentId = CONTINENT_BY_COUNTRY_ID[country.id];
      if (!continentId) continue;
      const list = map.get(continentId) ?? [];
      list.push(country.id);
      map.set(continentId, list);
    }
    return map;
  }, []);

  const continentStats = useMemo(
    () =>
      CONTINENTS.map((continent) => {
        const countryIds = countryIdsByContinent.get(continent.id) ?? [];
        const total = countryIds.reduce(
          (sum, id) => sum + (countByCountry[id] ?? 0),
          0,
        );
        const visitedCount = countryIds.reduce(
          (sum, id) => sum + (visitedByCountry[id] ?? 0),
          0,
        );
        return { continent, total, visitedCount };
      }).filter((stat) => stat.total > 0),
    [countryIdsByContinent, countByCountry, visitedByCountry],
  );

  // While searching, the continent list is replaced by a flat list of every
  // matching country (across all continents) that has content.
  const searchRows = useCountrySearchRows({
    search,
    language,
    totals: countByCountry,
    done: visitedByCountry,
    routeBase: "landmarks",
  });

  const totalLandmarks = Object.values(countByCountry).reduce((sum, c) => sum + c, 0);
  const percent =
    totalLandmarks > 0
      ? Math.min(100, Math.round((visited.length / totalLandmarks) * 100))
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={categoryMeta ? t(categoryMeta.titleKey) : t("category.landmarks")}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <ProgressCard
        label={t("landmarksPicker.progressLabel")}
        detail={t("landmarksPicker.progressDetail", {
          count: visited.length,
          total: totalLandmarks,
        })}
        percent={percent}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t("explore.searchPlaceholder")}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={palette.brand} />
          <Text style={{ marginTop: 12, color: palette.inkMuted }}>
            {t("explore.loading")}
          </Text>
        </View>
      ) : search.trim() ? (
        <CountrySearchResults
          rows={searchRows}
          accentColor={categoryMeta?.fg ?? palette.brand}
          footer={<SuggestionEntry category="landmarks" accentColor={categoryMeta?.fg} />}
        />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          data={continentStats}
          keyExtractor={(item) => item.continent.id}
          renderItem={({ item }) => (
            <ProgressRow
              title={language === "tr" ? item.continent.name : item.continent.nameEn}
              fractionLabel={`${item.visitedCount}/${item.total}`}
              percent={Math.round((item.visitedCount / item.total) * 100)}
              accentColor={categoryMeta?.fg ?? palette.brand}
              onPress={() => router.push(`/landmarks/continent/${item.continent.id}`)}
            />
          )}
          ListFooterComponent={
            <SuggestionEntry category="landmarks" accentColor={categoryMeta?.fg} />
          }
        />
      )}
    </View>
  );
}
