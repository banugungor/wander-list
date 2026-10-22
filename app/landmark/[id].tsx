import { RichText } from "@/components/rich-text";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { localizedCityName } from "@/data/cities";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import {
  localizedLandmarkDescription,
  localizedLandmarkDetails,
  localizedLandmarkName,
} from "@/data/landmarks";
import { toggleLandmarkVisited } from "@/data/landmarksVisited";
import worldData from "@/data/worldCountries.json";
import { useCityIndex } from "@/hooks/use-city-index";
import { useLandmarkDetail } from "@/hooks/use-landmark-detail";
import { useLandmarksVisited } from "@/hooks/use-landmarks-visited";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

/** A landmark's own page: photo, name, city/country, the short description and
 * the long-form `details` text (only landmarks the admin filled one in for get
 * linked here — see data/landmarkDetails.ts). Lives outside app/landmarks/ so
 * the trip screen can open it without going through that folder's paywall
 * guard; Landmarks itself is free anyway (`LANDMARKS_LOCK_ENABLED`). */
export default function LandmarkDetailScreen() {
  const { t, language } = useLanguage();
  const { id } = useLocalSearchParams();
  const landmarkId = (Array.isArray(id) ? id[0] : id) ?? "";

  const { landmark, loading } = useLandmarkDetail(landmarkId);
  const { byId: cityById } = useCityIndex();
  const [visited, setVisited] = useLandmarksVisited();
  const categoryMeta = getCategory("landmarks");

  const country = landmark
    ? worldData.countries.find((c) => c.id === landmark.countryId)
    : undefined;
  const countryName = country ? getLocalizedCountryName(country.name, language) : "";
  const cityRecord = landmark ? cityById[landmark.cityId] : undefined;
  const cityName = cityRecord ? localizedCityName(cityRecord, language) : "";
  const place = [cityName, countryName].filter(Boolean).join(" · ");

  const name = landmark ? localizedLandmarkName(landmark, language) : "";
  const description = landmark ? localizedLandmarkDescription(landmark, language) : null;
  const details = landmark ? localizedLandmarkDetails(landmark, language) : null;
  const isVisited = !!landmark && visited.includes(landmark.id);

  const handleToggle = async () => {
    if (!landmark) return;
    const updated = await toggleLandmarkVisited(
      landmark.id,
      { name, country: countryName, imageUrl: landmark.imageUrl },
      visited,
    );
    setVisited(updated);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="" accentBg={categoryMeta?.bg} accentFg={categoryMeta?.fg} />

      {loading && !landmark && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={palette.brand} />
        </View>
      )}

      {!loading && !landmark && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ fontSize: 15, color: palette.inkMuted, textAlign: "center" }}>
            {t("landmarkDetail.notFound")}
          </Text>
        </View>
      )}

      {landmark && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
        >
          {landmark.imageUrl ? (
            <Image
              source={{ uri: landmark.imageUrl }}
              style={{ width: "100%", height: 220, borderRadius: 16 }}
              contentFit="cover"
              transition={200}
            />
          ) : null}

          <Text
            style={{ marginTop: 16, fontSize: 22, fontWeight: "800", color: palette.ink }}
          >
            {name}
          </Text>

          {place ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 }}>
              <Ionicons name="location-outline" size={14} color={palette.inkMuted} />
              <Text style={{ fontSize: 14, color: palette.inkMuted }}>{place}</Text>
            </View>
          ) : null}

          {description ? (
            <Text
              style={{
                marginTop: 16,
                fontSize: 15,
                fontWeight: "600",
                color: palette.ink,
                lineHeight: 22,
              }}
            >
              {description}
            </Text>
          ) : null}

          {details ? (
            <View style={{ marginTop: 14 }}>
              <RichText text={details} />
            </View>
          ) : null}

          <Pressable
            onPress={handleToggle}
            style={({ pressed }) => [
              {
                marginTop: 28,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                borderWidth: isVisited ? 0.5 : 1,
                borderColor: palette.hairline,
                backgroundColor: isVisited ? (categoryMeta?.fg ?? palette.brand) : palette.surface,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: isVisited ? palette.surface : palette.ink,
              }}
            >
              {isVisited ? t("landmarkDetail.markedVisited") : t("landmarkDetail.markVisited")}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
