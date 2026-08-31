import { ProgressCard } from "@/components/progress-card";
import { ProgressRow } from "@/components/progress-row";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { CONTINENT_BY_COUNTRY_ID, CONTINENTS } from "@/data/continents";
import { visitedCountByCountry } from "@/data/islands";
import worldData from "@/data/worldCountries.json";
import { useIslandsIndex } from "@/hooks/use-islands-index";
import { useIslandsVisited } from "@/hooks/use-islands-visited";
import { Stack, router } from "expo-router";
import { useMemo } from "react";
import { FlatList, View } from "react-native";

export default function IslandsContinentPickerScreen() {
  const { t, language } = useLanguage();
  const categoryMeta = getCategory("islands");

  const [visited] = useIslandsVisited();
  const { counts, countryByIslandId } = useIslandsIndex();
  const visitedByCountry = useMemo(
    () => visitedCountByCountry(visited, countryByIslandId),
    [visited, countryByIslandId],
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
        const total = countryIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
        const visitedCount = countryIds.reduce(
          (sum, id) => sum + (visitedByCountry[id] ?? 0),
          0,
        );
        return { continent, total, visitedCount };
      }),
    [countryIdsByContinent, counts, visitedByCountry],
  );

  const totalIslands = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const percent =
    totalIslands > 0
      ? Math.min(100, Math.round((visited.length / totalIslands) * 100))
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={categoryMeta ? t(categoryMeta.titleKey) : t("category.islands")}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <ProgressCard
        label={t("islandsPicker.progressLabel")}
        detail={t("islandsPicker.progressDetail", {
          count: visited.length,
          total: totalIslands,
        })}
        percent={percent}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <FlatList
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        data={continentStats}
        keyExtractor={(item) => item.continent.id}
        renderItem={({ item }) => {
          const rowPercent =
            item.total > 0 ? Math.round((item.visitedCount / item.total) * 100) : 0;
          return (
            <ProgressRow
              title={language === "tr" ? item.continent.name : item.continent.nameEn}
              fractionLabel={
                item.total > 0
                  ? `${item.visitedCount}/${item.total}`
                  : t("islandsPicker.noIslandsYet")
              }
              percent={rowPercent}
              accentColor={categoryMeta?.fg ?? palette.brand}
              onPress={() => router.push(`/islands/continent/${item.continent.id}`)}
            />
          );
        }}
      />
    </View>
  );
}
