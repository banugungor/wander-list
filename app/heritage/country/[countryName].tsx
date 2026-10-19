import { HeritageThumbnail } from "@/components/heritage-thumbnail";
import { HeritageBadges } from "@/components/heritage-badges";
import { ProgressCard } from "@/components/progress-card";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { splitCountryField } from "@/data/heritageContinents";
import type { HeritageItem } from "@/data/heritageSites";
import { getLocalizedHeritageItem } from "@/data/heritageTranslations";
import { matchesSearch } from "@/data/searchText";
import { useHeritageExplorer } from "@/hooks/use-heritage-explorer";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

export default function HeritageCountryScreen() {
  const { t, language } = useLanguage();
  const { countryName } = useLocalSearchParams();
  const name = Array.isArray(countryName) ? countryName[0] : countryName ?? "";
  const categoryMeta = getCategory("heritage");
  const heritage = useHeritageExplorer(true);

  const sites = useMemo(
    () =>
      heritage.data.filter((item) =>
        splitCountryField(item.country).includes(name),
      ),
    [heritage.data, name],
  );

  const [search, setSearch] = useState("");
  const filteredSites = useMemo(
    () => sites.filter((item) => matchesSearch(search, item.name, item.nameTr ?? "")),
    [sites, search],
  );

  const visitedInCountry = sites.filter((item) =>
    heritage.visited.includes(item.id),
  ).length;
  const percent =
    sites.length > 0
      ? Math.min(100, Math.round((visitedInCountry / sites.length) * 100))
      : 0;

  const renderItem = ({ item }: { item: HeritageItem }) => {
    const isVisited = heritage.visited.includes(item.id);
    const displayItem = getLocalizedHeritageItem(item, language);

    return (
      <Pressable
        onPress={() => router.push(`/heritage/${encodeURIComponent(item.id)}`)}
        style={({ pressed }) => [
          {
            backgroundColor: palette.surface,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: palette.hairline,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <HeritageThumbnail item={item} />

        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 17, fontWeight: "700", color: palette.ink, lineHeight: 22 }}
          >
            {displayItem.name}
          </Text>

          <HeritageBadges item={item} marginTop={8} />
        </View>

        <Pressable
          onPress={() => heritage.toggle(item.id)}
          hitSlop={8}
          style={({ pressed }) => [
            {
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isVisited
                ? (categoryMeta?.fg ?? palette.brand)
                : palette.cream,
              borderWidth: isVisited ? 0 : 1,
              borderColor: palette.hairline,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons
            name={isVisited ? "checkmark" : "ellipse-outline"}
            size={17}
            color={isVisited ? palette.surface : palette.inkFaint}
          />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={getLocalizedCountryName(name, language)}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <ProgressCard
        label={t("heritageCountry.visited")}
        detail={t("explore.progressDetail", {
          count: visitedInCountry,
          total: sites.length,
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

      <FlatList
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        data={filteredSites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
            {t("explore.noResults")}
          </Text>
        }
      />
    </View>
  );
}
