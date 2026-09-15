import { ProgressCard } from "@/components/progress-card";
import { ProgressRow } from "@/components/progress-row";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { localizedCityName } from "@/data/cities";
import { visitedCountByCity } from "@/data/landmarks";
import worldData from "@/data/worldCountries.json";
import { useCityIndex } from "@/hooks/use-city-index";
import { useLandmarksIndex } from "@/hooks/use-landmarks-index";
import { useLandmarksVisited } from "@/hooks/use-landmarks-visited";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Filter = "all" | "visited" | "unvisited";

export default function LandmarksCountryCitiesScreen() {
  const { t, language } = useLanguage();
  const { countryId } = useLocalSearchParams();
  const id = Array.isArray(countryId) ? countryId[0] : countryId ?? "";
  const country = useMemo(() => worldData.countries.find((c) => c.id === id), [id]);
  const countryName = country ? getLocalizedCountryName(country.name, language) : "";
  const categoryMeta = getCategory("landmarks");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [visited] = useLandmarksVisited();
  const {
    countByCity,
    cityIdsByCountry,
    cityByLandmarkId,
    loading: landmarksLoading,
  } = useLandmarksIndex();
  const { byId: cityById, loading: citiesLoading } = useCityIndex();
  const loading = landmarksLoading || citiesLoading;

  const visitedByCity = useMemo(
    () => visitedCountByCity(visited, cityByLandmarkId),
    [visited, cityByLandmarkId],
  );

  const cities = useMemo(
    () =>
      (cityIdsByCountry[id] ?? [])
        .map((cityId) => cityById[cityId])
        .filter((c): c is NonNullable<typeof c> => !!c),
    [cityIdsByCountry, id, cityById],
  );

  const total = cities.reduce((sum, c) => sum + (countByCity[c.id] ?? 0), 0);
  const visitedTotal = cities.reduce((sum, c) => sum + (visitedByCity[c.id] ?? 0), 0);
  const percent = total > 0 ? Math.min(100, Math.round((visitedTotal / total) * 100)) : 0;

  const filteredCities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cities
      .filter((c) => {
        if (query) {
          const matches =
            c.name.toLowerCase().includes(query) ||
            localizedCityName(c, language).toLowerCase().includes(query);
          if (!matches) return false;
        }
        const cityVisited = visitedByCity[c.id] ?? 0;
        if (filter === "visited" && cityVisited === 0) return false;
        if (filter === "unvisited" && cityVisited > 0) return false;
        return true;
      })
      .sort((a, b) => localizedCityName(a, language).localeCompare(localizedCityName(b, language)));
  }, [cities, search, filter, visitedByCity, language]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={countryName}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <ProgressCard
        label={t("landmarksCountry.countryLabel", { country: countryName })}
        detail={t("landmarksPicker.progressDetail", { count: visitedTotal, total })}
        percent={percent}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={palette.brand} />
          <Text style={{ marginTop: 12, color: palette.inkMuted }}>
            {t("landmarksCountry.loading")}
          </Text>
        </View>
      ) : cities.length === 0 ? (
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
            {t("landmarksCountry.empty")}
          </Text>
        </View>
      ) : (
        <>
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
                { id: "visited", label: t("landmarksPicker.filterVisited") },
                { id: "unvisited", label: t("landmarksPicker.filterUnvisited") },
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
            data={filteredCities}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
                {t("explore.noResults")}
              </Text>
            }
            renderItem={({ item }) => {
              const cityTotal = countByCity[item.id] ?? 0;
              const cityVisited = visitedByCity[item.id] ?? 0;
              return (
                <ProgressRow
                  title={localizedCityName(item, language)}
                  fractionLabel={`${cityVisited}/${cityTotal}`}
                  percent={Math.round((cityVisited / cityTotal) * 100)}
                  accentColor={categoryMeta?.fg ?? palette.brand}
                  onPress={() => router.push(`/landmarks/${id}/${item.id}`)}
                />
              );
            }}
          />
        </>
      )}
    </View>
  );
}
