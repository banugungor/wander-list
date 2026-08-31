import { CountryFlag } from "@/components/country-flag";
import { ProgressCard } from "@/components/progress-card";
import { ProgressRow } from "@/components/progress-row";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { CONTINENT_BY_COUNTRY_ID, CONTINENTS } from "@/data/continents";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { visitedCountByCountry } from "@/data/islands";
import worldData from "@/data/worldCountries.json";
import { useIslandsIndex } from "@/hooks/use-islands-index";
import { useIslandsVisited } from "@/hooks/use-islands-visited";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

type Country = { id: string; name: string; iso2: string };
type Filter = "all" | "visited" | "unvisited";

export default function IslandsContinentCountriesScreen() {
  const { t, language } = useLanguage();
  const { continentId } = useLocalSearchParams();
  const id = Array.isArray(continentId) ? continentId[0] : continentId ?? "";
  const continent = CONTINENTS.find((c) => c.id === id);
  const categoryMeta = getCategory("islands");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [visited] = useIslandsVisited();
  const { counts, countryByIslandId } = useIslandsIndex();
  const visitedByCountry = useMemo(
    () => visitedCountByCountry(visited, countryByIslandId),
    [visited, countryByIslandId],
  );

  const countries = useMemo(
    () =>
      (worldData.countries as Country[]).filter(
        (c) => CONTINENT_BY_COUNTRY_ID[c.id] === id,
      ),
    [id],
  );

  const total = countries.reduce((sum, c) => sum + (counts[c.id] ?? 0), 0);
  const visitedTotal = countries.reduce(
    (sum, c) => sum + (visitedByCountry[c.id] ?? 0),
    0,
  );
  const percent = total > 0 ? Math.min(100, Math.round((visitedTotal / total) * 100)) : 0;

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return countries
      .filter((c) => {
        if (query) {
          const matches =
            c.name.toLowerCase().includes(query) ||
            getLocalizedCountryName(c.name, language).toLowerCase().includes(query);
          if (!matches) return false;
        }
        const countryVisited = visitedByCountry[c.id] ?? 0;
        if (filter === "visited" && countryVisited === 0) return false;
        if (filter === "unvisited" && countryVisited > 0) return false;
        return true;
      })
      .sort((a, b) =>
        getLocalizedCountryName(a.name, language).localeCompare(
          getLocalizedCountryName(b.name, language),
        ),
      );
  }, [countries, search, filter, visitedByCountry, language]);

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
        label={t("islandsPicker.continentLabel", { continent: continentName })}
        detail={t("islandsPicker.progressDetail", { count: visitedTotal, total })}
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
            { id: "visited", label: t("islandsPicker.filterVisited") },
            { id: "unvisited", label: t("islandsPicker.filterUnvisited") },
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
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
            {t("explore.noResults")}
          </Text>
        }
        renderItem={({ item }) => {
          const countryTotal = counts[item.id] ?? 0;
          const countryVisited = visitedByCountry[item.id] ?? 0;
          const rowPercent =
            countryTotal > 0 ? Math.round((countryVisited / countryTotal) * 100) : 0;
          return (
            <ProgressRow
              leading={<CountryFlag id={item.id} iso2={item.iso2} size={20} />}
              title={getLocalizedCountryName(item.name, language)}
              fractionLabel={
                countryTotal > 0
                  ? `${countryVisited}/${countryTotal}`
                  : t("islandsPicker.noIslandsYet")
              }
              percent={rowPercent}
              accentColor={categoryMeta?.fg ?? palette.brand}
              onPress={() => router.push(`/islands/${item.id}`)}
            />
          );
        }}
      />
    </View>
  );
}
