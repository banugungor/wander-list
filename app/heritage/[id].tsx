import { HeritageThumbnail } from "@/components/heritage-thumbnail";
import { HeritageBadges } from "@/components/heritage-badges";
import { ScreenHeader } from "@/components/screen-header";
import { HeritagePhotoSuggestionEntry } from "@/components/suggestion-entry";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryField } from "@/data/countryNamesTr";
import { getHeritageSiteById } from "@/data/heritageSites";
import { getLocalizedHeritageItem } from "@/data/heritageTranslations";
import { toggleHeritageVisited } from "@/data/heritageStorage";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function HeritageDetailScreen() {
  const { t, language } = useLanguage();
  const { id } = useLocalSearchParams();
  const siteId = Array.isArray(id) ? id[0] : id;

  const item = useMemo(
    () => (siteId ? getHeritageSiteById(siteId) : null),
    [siteId],
  );
  const displayItem = useMemo(
    () => (item ? getLocalizedHeritageItem(item, language) : null),
    [item, language],
  );

  const visited = useAppStore((s) => s.visitedHeritage);
  const setVisited = useAppStore((s) => s.setVisitedHeritage);

  const isVisited = !!item && visited.includes(item.id);
  const categoryMeta = getCategory("heritage");

  const handleToggle = async () => {
    if (!item) return;
    const updated = await toggleHeritageVisited(item.id, item, visited);
    setVisited(updated);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title=""
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      {!item && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ fontSize: 15, color: palette.inkMuted }}>
            {t("heritageDetail.notFound")}
          </Text>
        </View>
      )}

      {item && (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 40,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <HeritageThumbnail item={item} size={240} />
          </View>

          <HeritageBadges item={item} marginTop={16} />

          <Text
            style={{
              marginTop: 10,
              fontSize: 22,
              fontWeight: "800",
              color: palette.ink,
            }}
          >
            {displayItem?.name}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 6,
              gap: 4,
            }}
          >
            <Ionicons
              name="location-outline"
              size={14}
              color={palette.inkMuted}
            />
            <Text style={{ fontSize: 14, color: palette.inkMuted }}>
              {getLocalizedCountryField(item.country, language)}
            </Text>
          </View>

          <Text
            style={{
              marginTop: 16,
              fontSize: 14,
              color: palette.inkMuted,
              lineHeight: 20,
            }}
          >
            {displayItem?.description ?? t("heritageDetail.noDescription")}
          </Text>

          {/* The card brings its own side margin (made for full-width lists). */}
          <View style={{ marginHorizontal: -16 }}>
            <HeritagePhotoSuggestionEntry item={item} accentColor={categoryMeta?.fg} />
          </View>

          <Pressable
            onPress={handleToggle}
            style={({ pressed }) => [
              {
                marginTop: 24,
                marginBottom: 24,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                borderWidth: isVisited ? 0.5 : 1,
                borderColor: palette.hairline,
                backgroundColor: isVisited
                  ? (categoryMeta?.fg ?? palette.brand)
                  : palette.surface,
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
              {isVisited ? t("heritageDetail.markedVisited") : t("heritageDetail.markVisited")}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
