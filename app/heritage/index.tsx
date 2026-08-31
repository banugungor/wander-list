import { ProgressCard } from "@/components/progress-card";
import { ProgressRow } from "@/components/progress-row";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { CONTINENTS, ContinentId } from "@/data/continents";
import { getContinentsForCountryField } from "@/data/heritageContinents";
import { useHeritageExplorer } from "@/hooks/use-heritage-explorer";
import { Stack, router } from "expo-router";
import { useMemo } from "react";
import { FlatList, View } from "react-native";

export default function HeritageContinentPickerScreen() {
  const { t, language } = useLanguage();
  const categoryMeta = getCategory("heritage");
  const heritage = useHeritageExplorer(true);

  const continentStats = useMemo(() => {
    const tally = new Map<ContinentId, { total: number; visited: number }>();
    for (const item of heritage.data) {
      const isVisited = heritage.visited.includes(item.id);
      for (const continentId of getContinentsForCountryField(item.country)) {
        const entry = tally.get(continentId) ?? { total: 0, visited: 0 };
        entry.total += 1;
        if (isVisited) entry.visited += 1;
        tally.set(continentId, entry);
      }
    }
    return CONTINENTS.map((continent) => ({
      continent,
      total: tally.get(continent.id)?.total ?? 0,
      visited: tally.get(continent.id)?.visited ?? 0,
    })).filter((stat) => stat.total > 0);
  }, [heritage.data, heritage.visited]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={categoryMeta ? t(categoryMeta.titleKey) : t("category.heritage")}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <ProgressCard
        label={t("heritagePicker.progressLabel")}
        detail={t("heritagePicker.progressDetail", {
          count: heritage.visited.length,
          total: heritage.heritageTotal,
        })}
        percent={heritage.percent}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <FlatList
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        data={continentStats}
        keyExtractor={(item) => item.continent.id}
        renderItem={({ item }) => {
          const percent =
            item.total > 0 ? Math.round((item.visited / item.total) * 100) : 0;
          return (
            <ProgressRow
              title={language === "tr" ? item.continent.name : item.continent.nameEn}
              fractionLabel={`${item.visited}/${item.total}`}
              percent={percent}
              accentColor={categoryMeta?.fg ?? palette.brand}
              onPress={() => router.push(`/heritage/continent/${item.continent.id}`)}
            />
          );
        }}
      />
    </View>
  );
}
