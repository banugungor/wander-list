import { EntryListRow } from "@/components/entry-list-row";
import { ProgressCard } from "@/components/progress-card";
import { ScreenHeader } from "@/components/screen-header";
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
import worldData from "@/data/worldCountries.json";
import { useCityIndex } from "@/hooks/use-city-index";
import { useCityLandmarks } from "@/hooks/use-city-landmarks";
import { useLandmarksVisited } from "@/hooks/use-landmarks-visited";
import { Stack, useLocalSearchParams } from "expo-router";
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

  const visitedInCity = landmarks.filter((l) => visited.includes(l.id)).length;
  const percent =
    landmarks.length > 0
      ? Math.min(100, Math.round((visitedInCity / landmarks.length) * 100))
      : 0;

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
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

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

          <FlatList
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
            data={landmarks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        </>
      )}
    </View>
  );
}
