import { ProgressCard } from "@/components/progress-card";
import { ProgressRow } from "@/components/progress-row";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { CONTINENT_BY_COUNTRY_ID, CONTINENTS } from "@/data/continents";
import { tastedCountByCountry } from "@/data/cuisineMeals";
import worldData from "@/data/worldCountries.json";
import { useCuisineMealIndex } from "@/hooks/use-cuisine-meal-index";
import { useCuisineVisited } from "@/hooks/use-cuisine-visited";
import { Stack, router } from "expo-router";
import { useMemo } from "react";
import { FlatList, View } from "react-native";

export default function CuisineContinentPickerScreen() {
  const { t, language } = useLanguage();
  const categoryMeta = getCategory("cuisine");

  const [visited] = useCuisineVisited();
  const { counts, countryByMealId } = useCuisineMealIndex();
  const tastedByCountry = useMemo(
    () => tastedCountByCountry(visited, countryByMealId),
    [visited, countryByMealId],
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
        const tasted = countryIds.reduce(
          (sum, id) => sum + (tastedByCountry[id] ?? 0),
          0,
        );
        return { continent, total, tasted };
      }).filter((stat) => stat.total > 0),
    [countryIdsByContinent, counts, tastedByCountry],
  );

  const totalMeals = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const percent =
    totalMeals > 0 ? Math.min(100, Math.round((visited.length / totalMeals) * 100)) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={categoryMeta ? t(categoryMeta.titleKey) : t("category.cuisine")}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <ProgressCard
        label={t("cuisinePicker.progressLabel")}
        detail={t("cuisinePicker.progressDetail", {
          count: visited.length,
          total: totalMeals,
        })}
        percent={percent}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <FlatList
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        data={continentStats}
        keyExtractor={(item) => item.continent.id}
        renderItem={({ item }) => (
          <ProgressRow
            title={language === "tr" ? item.continent.name : item.continent.nameEn}
            fractionLabel={`${item.tasted}/${item.total}`}
            percent={Math.round((item.tasted / item.total) * 100)}
            accentColor={categoryMeta?.fg ?? palette.brand}
            onPress={() => router.push(`/cuisine/continent/${item.continent.id}`)}
          />
        )}
      />
    </View>
  );
}
