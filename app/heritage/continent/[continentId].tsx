import { ProgressCard } from "@/components/progress-card";
import { ProgressRow } from "@/components/progress-row";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { CONTINENTS, ContinentId } from "@/data/continents";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import {
  getContinentForCountryName,
  splitCountryField,
} from "@/data/heritageContinents";
import { useHeritageExplorer } from "@/hooks/use-heritage-explorer";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, FlatList, Text, TextInput, View } from "react-native";

type Filter = "all" | "visited" | "unvisited";

export default function HeritageContinentCountriesScreen() {
  const { t, language } = useLanguage();
  const { continentId } = useLocalSearchParams();
  const id = (Array.isArray(continentId) ? continentId[0] : continentId ?? "") as ContinentId;
  const continent = CONTINENTS.find((c) => c.id === id);
  const categoryMeta = getCategory("heritage");
  const heritage = useHeritageExplorer(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const countryStats = useMemo(() => {
    const map = new Map<string, { total: number; visited: number }>();
    for (const item of heritage.data) {
      for (const token of splitCountryField(item.country)) {
        if (getContinentForCountryName(token) !== id) continue;
        const entry = map.get(token) ?? { total: 0, visited: 0 };
        entry.total += 1;
        if (heritage.visited.includes(item.id)) entry.visited += 1;
        map.set(token, entry);
      }
    }
    return [...map.entries()].map(([name, stats]) => ({ name, ...stats }));
  }, [heritage.data, heritage.visited, id]);

  const total = countryStats.reduce((sum, c) => sum + c.total, 0);
  const visitedTotal = countryStats.reduce((sum, c) => sum + c.visited, 0);
  const percent = total > 0 ? Math.min(100, Math.round((visitedTotal / total) * 100)) : 0;

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return countryStats
      .filter((c) => {
        if (query) {
          const matches =
            c.name.toLowerCase().includes(query) ||
            getLocalizedCountryName(c.name, language).toLowerCase().includes(query);
          if (!matches) return false;
        }
        if (filter === "visited" && c.visited === 0) return false;
        if (filter === "unvisited" && c.visited > 0) return false;
        return true;
      })
      .sort((a, b) =>
        getLocalizedCountryName(a.name, language).localeCompare(
          getLocalizedCountryName(b.name, language),
        ),
      );
  }, [countryStats, search, filter, language]);

  const continentName = continent
    ? language === "tr"
      ? continent.name
      : continent.nameEn
    : "";

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={continentName}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <ProgressCard
        label={t("heritagePicker.continentLabel", { continent: continentName })}
        detail={t("explore.progressDetail", { count: visitedTotal, total })}
        percent={percent}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 16,
          marginTop: 16,
          paddingHorizontal: 14,
          height: 44,
          borderRadius: 12,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.hairline,
        }}
      >
        <Ionicons name="search-outline" size={18} color={palette.inkFaint} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("explore.searchPlaceholder")}
          placeholderTextColor={palette.inkFaint}
          style={{ flex: 1, marginLeft: 8, fontSize: 15, color: palette.ink }}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={palette.inkFaint} />
          </Pressable>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 12 }}>
        {(
          [
            { id: "all", label: t("common.all") },
            { id: "visited", label: t("heritagePicker.filterVisited") },
            { id: "unvisited", label: t("heritagePicker.filterUnvisited") },
          ] as const
        ).map((chip) => {
          const active = filter === chip.id;
          return (
            <Pressable
              key={chip.id}
              onPress={() => setFilter(chip.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: active
                  ? (categoryMeta?.fg ?? palette.brand)
                  : palette.surface,
                borderWidth: active ? 0 : 1,
                borderColor: palette.hairline,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: active ? palette.surface : palette.inkMuted,
                }}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        data={filteredCountries}
        keyExtractor={(item) => item.name}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
            {t("explore.noResults")}
          </Text>
        }
        renderItem={({ item }) => {
          const rowPercent =
            item.total > 0 ? Math.round((item.visited / item.total) * 100) : 0;
          return (
            <ProgressRow
              title={getLocalizedCountryName(item.name, language)}
              fractionLabel={`${item.visited}/${item.total}`}
              percent={rowPercent}
              accentColor={categoryMeta?.fg ?? palette.brand}
              onPress={() =>
                router.push(`/heritage/country/${encodeURIComponent(item.name)}`)
              }
            />
          );
        }}
      />
    </View>
  );
}
