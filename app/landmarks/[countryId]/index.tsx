import { CountrySearchResults } from "@/components/country-search-results";
import { ProgressCard } from "@/components/progress-card";
import { ProgressRow } from "@/components/progress-row";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { SuggestionEntry } from "@/components/suggestion-entry";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { localizedCityName } from "@/data/cities";
import { visitedCountByCity } from "@/data/landmarks";
import worldData from "@/data/worldCountries.json";
import { matchesSearch } from "@/data/searchText";
import { useCityIndex } from "@/hooks/use-city-index";
import { useNameIndexSearchRows } from "@/hooks/use-name-index-search-rows";
import { useLandmarksIndex } from "@/hooks/use-landmarks-index";
import { useLandmarksVisited } from "@/hooks/use-landmarks-visited";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
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
    return cities
      .filter((c) => {
        if (!matchesSearch(search, c.name, localizedCityName(c, language))) return false;
        const cityVisited = visitedByCity[c.id] ?? 0;
        if (filter === "visited" && cityVisited === 0) return false;
        if (filter === "unvisited" && cityVisited > 0) return false;
        return true;
      })
      .sort((a, b) => localizedCityName(a, language).localeCompare(localizedCityName(b, language)));
  }, [cities, search, filter, visitedByCity, language]);

  // Individual landmarks of this country matching the search; their subtitle
  // is the city they're in rather than the (already known) country.
  const cityNameFor = useCallback(
    (entry: { cityId: string | null }) => {
      const city = entry.cityId ? cityById[entry.cityId] : undefined;
      return city ? localizedCityName(city, language) : countryName;
    },
    [cityById, language, countryName],
  );
  const { rows: landmarkRows, loading: landmarksSearchLoading } =
    useNameIndexSearchRows({
      category: "landmarks",
      search,
      language,
      countryId: id,
      subtitleFor: cityNameFor,
    });

  const cityRows = useMemo(
    () =>
      filteredCities.map((c) => ({
        key: c.id,
        title: localizedCityName(c, language),
        done: visitedByCity[c.id] ?? 0,
        total: countByCity[c.id] ?? 0,
        onPress: () => router.push(`/landmarks/${id}/${c.id}`),
      })),
    [filteredCities, visitedByCity, countByCity, language, id],
  );

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
          <View style={{ alignSelf: "stretch" }}>
            <SuggestionEntry category="landmarks" countryId={id} accentColor={categoryMeta?.fg} />
          </View>
        </View>
      ) : (
        <>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={t("explore.searchPlaceholder")}
          />

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

          {search.trim() ? (
            <CountrySearchResults
              rows={cityRows}
              accentColor={categoryMeta?.fg ?? palette.brand}
              itemRows={landmarkRows}
              itemsLoading={landmarksSearchLoading}
              rowsTitle={t("explore.sectionCities")}
              itemsTitle={t("explore.sectionPlaces")}
              footer={
                <SuggestionEntry
                  category="landmarks"
                  countryId={id}
                  accentColor={categoryMeta?.fg}
                />
              }
            />
          ) : (
            <FlatList
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
              data={filteredCities}
              keyExtractor={(item) => item.id}
              ListFooterComponent={
                <SuggestionEntry
                  category="landmarks"
                  countryId={id}
                  accentColor={categoryMeta?.fg}
                />
              }
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
          )}
        </>
      )}
    </View>
  );
}
