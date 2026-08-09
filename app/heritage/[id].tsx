import { HeritageThumbnail } from "@/components/heritage-thumbnail";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { getHeritageSiteById } from "@/data/heritageSites";
import { toggleHeritageVisited } from "@/data/heritageStorage";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function HeritageDetailScreen() {
  const { id } = useLocalSearchParams();
  const siteId = Array.isArray(id) ? id[0] : id;

  const item = useMemo(
    () => (siteId ? getHeritageSiteById(siteId) : null),
    [siteId],
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
            Bu miras alanı bulunamadı.
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

          {item.category && (
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: 16,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: palette.violetSoft,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: palette.violet,
                  letterSpacing: 0.5,
                }}
              >
                {item.category.toUpperCase()}
              </Text>
            </View>
          )}

          <Text
            style={{
              marginTop: 10,
              fontSize: 22,
              fontWeight: "800",
              color: palette.ink,
            }}
          >
            {item.name}
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
              {item.country}
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
            {item.description ?? "Bu miras alanı için henüz açıklama yok."}
          </Text>

          <Pressable
            onPress={handleToggle}
            style={({ pressed }) => [
              {
                marginTop: 24,
                marginBottom: 18,
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
              {isVisited ? "Gezildi olarak işaretlendi" : "Gezildi olarak işaretle"}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
