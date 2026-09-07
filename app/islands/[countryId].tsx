import { EntryListRow } from "@/components/entry-list-row";
import { ProgressCard } from "@/components/progress-card";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import {
  localizedIslandDescription,
  localizedIslandName,
  type Island,
} from "@/data/islands";
import { toggleIslandVisited } from "@/data/islandsVisited";
import worldData from "@/data/worldCountries.json";
import { useCountryIslands } from "@/hooks/use-country-islands";
import { useIslandsVisited } from "@/hooks/use-islands-visited";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

export default function IslandsCountryScreen() {
  const { t, language } = useLanguage();
  const { countryId } = useLocalSearchParams();
  const id = Array.isArray(countryId) ? countryId[0] : countryId ?? "";

  const country = useMemo(
    () => worldData.countries.find((c) => c.id === id),
    [id],
  );
  const countryName = country
    ? getLocalizedCountryName(country.name, language)
    : t("explore.detailsTitle");

  const categoryMeta = getCategory("islands");
  const { islands, loading } = useCountryIslands(id);
  const [visited, setVisited] = useIslandsVisited();

  const visitedInCountry = islands.filter((i) => visited.includes(i.id)).length;
  const percent =
    islands.length > 0
      ? Math.min(100, Math.round((visitedInCountry / islands.length) * 100))
      : 0;

  const handleToggle = async (island: Island) => {
    const updated = await toggleIslandVisited(
      island.id,
      {
        name: localizedIslandName(island, language),
        country: countryName,
        imageUrl: island.imageUrl,
      },
      visited,
    );
    setVisited(updated);
  };

  const renderItem = ({ item }: { item: Island }) => (
    <EntryListRow
      name={localizedIslandName(item, language)}
      description={localizedIslandDescription(item, language)}
      imageUrl={item.imageUrl}
      icon="boat-outline"
      iconColor={palette.violetText}
      isVisited={visited.includes(item.id)}
      toggleColor={categoryMeta?.fg ?? palette.brand}
      onTogglePress={() => handleToggle(item)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={countryName}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      {loading && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={palette.brand} />
          <Text style={{ marginTop: 12, color: palette.inkMuted }}>
            {t("islandsCountry.loading")}
          </Text>
        </View>
      )}

      {!loading && islands.length === 0 && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: palette.inkMuted,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {t("islandsCountry.empty")}
          </Text>
        </View>
      )}

      {!loading && islands.length > 0 && (
        <>
          <ProgressCard
            label={t("islandsCountry.visited")}
            detail={t("explore.progressDetail", {
              count: visitedInCountry,
              total: islands.length,
            })}
            percent={percent}
            accentBg={categoryMeta?.bg}
            accentFg={categoryMeta?.fg}
          />

          <FlatList
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
            data={islands}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        </>
      )}
    </View>
  );
}
