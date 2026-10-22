import { EntryListRow } from "@/components/entry-list-row";
import { useEntryPhotoSuggestion } from "@/hooks/use-entry-photo-suggestion";
import { ProgressCard } from "@/components/progress-card";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { localizedCityName } from "@/data/cities";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import {
  localizedLandmarkDescription,
  localizedLandmarkName,
  type Landmark,
} from "@/data/landmarks";
import { toggleLandmarkVisited } from "@/data/landmarksVisited";
import { matchesSearch } from "@/data/searchText";
import worldData from "@/data/worldCountries.json";
import { useCityIndex } from "@/hooks/use-city-index";
import { useCityLandmarks } from "@/hooks/use-city-landmarks";
import { useLandmarkDetailIds } from "@/hooks/use-landmark-detail-ids";
import { useLandmarksVisited } from "@/hooks/use-landmarks-visited";
import { useSearchParamState } from "@/hooks/use-search-param-state";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

export default function LandmarksCityScreen() {
  const { t, language } = useLanguage();
  const { countryId, cityId } = useLocalSearchParams();
  const id = Array.isArray(countryId) ? countryId[0] : countryId ?? "";
  const city = Array.isArray(cityId) ? cityId[0] : cityId ?? "";

  const country = useMemo(() => worldData.countries.find((c) => c.id === id), [id]);
  const countryName = country
    ? getLocalizedCountryName(country.name, language)
    : t("explore.detailsTitle");

  const { byId: cityById } = useCityIndex();
  const cityRecord = cityById[city];
  const cityName = cityRecord ? localizedCityName(cityRecord, language) : countryName;

  const categoryMeta = getCategory("landmarks");
  const { landmarks, loading } = useCityLandmarks(id, city);
  const [visited, setVisited] = useLandmarksVisited();
  const [search, setSearch] = useSearchParamState();

  const filteredLandmarks = useMemo(
    () => landmarks.filter((l) => matchesSearch(search, l.name, l.nameTr ?? "")),
    [landmarks, search],
  );

  const visitedInCity = landmarks.filter((l) => visited.includes(l.id)).length;
  const percent =
    landmarks.length > 0
      ? Math.min(100, Math.round((visitedInCity / landmarks.length) * 100))
      : 0;

  const detailIds = useLandmarkDetailIds();
  const photoSuggestion = useEntryPhotoSuggestion("landmarks", id);

  const handleToggle = async (landmark: Landmark) => {
    const updated = await toggleLandmarkVisited(
      landmark.id,
      {
        name: localizedLandmarkName(landmark, language),
        country: countryName,
        imageUrl: landmark.imageUrl,
      },
      visited,
    );
    setVisited(updated);
  };

  const renderItem = ({ item }: { item: Landmark }) => (
    <EntryListRow
      name={localizedLandmarkName(item, language)}
      description={localizedLandmarkDescription(item, language)}
      imageUrl={item.imageUrl}
      icon="trail-sign-outline"
      iconColor={palette.amberText}
      isVisited={visited.includes(item.id)}
      toggleColor={categoryMeta?.fg ?? palette.brand}
      onTogglePress={() => handleToggle(item)}
      onAddPhotoPress={() => photoSuggestion.open({ id: item.id, name: item.name })}
      onDetailPress={detailIds[item.id] ? () => router.push(`/landmark/${item.id}`) : undefined}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />
      {photoSuggestion.modal}

      <ScreenHeader
        title={cityName}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      {loading && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={palette.brand} />
          <Text style={{ marginTop: 12, color: palette.inkMuted }}>
            {t("landmarksCity.loading")}
          </Text>
        </View>
      )}

      {!loading && landmarks.length === 0 && (
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
            {t("landmarksCity.empty")}
          </Text>
        </View>
      )}

      {!loading && landmarks.length > 0 && (
        <>
          <ProgressCard
            label={t("landmarksCity.visited")}
            detail={t("explore.progressDetail", {
              count: visitedInCity,
              total: landmarks.length,
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
            data={filteredLandmarks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
                {t("explore.noResults")}
              </Text>
            }
          />
        </>
      )}
    </View>
  );
}
