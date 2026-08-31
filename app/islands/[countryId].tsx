import { ProgressCard } from "@/components/progress-card";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import {
  localizedIslandDescription,
  localizedIslandName,
  type Island,
} from "@/data/islands";
import { toggleIslandVisited } from "@/data/islandsVisited";
import worldData from "@/data/worldCountries.json";
import { useCountryIslands } from "@/hooks/use-country-islands";
import { useIslandsVisited } from "@/hooks/use-islands-visited";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

export default function IslandsCountryScreen() {
  const { t, language } = useLanguage();
  const { countryId } = useLocalSearchParams();
  const id = Array.isArray(countryId) ? countryId[0] : countryId ?? "";

  const country = useMemo(
    () => worldData.countries.find((c) => c.id === id),
    [id],
  );
  const countryName = country
    ? getLocalizedCountryName(country.name, language)
    : t("explore.detailsTitle");

  const categoryMeta = getCategory("islands");
  const { islands, loading } = useCountryIslands(id);
  const [visited, setVisited] = useIslandsVisited();

  const visitedInCountry = islands.filter((i) => visited.includes(i.id)).length;
  const percent =
    islands.length > 0
      ? Math.min(100, Math.round((visitedInCountry / islands.length) * 100))
      : 0;

  const handleToggle = async (island: Island) => {
    const updated = await toggleIslandVisited(
      island.id,
      {
        name: localizedIslandName(island, language),
        country: countryName,
        imageUrl: island.imageUrl,
      },
      visited,
    );
    setVisited(updated);
  };

  const renderItem = ({ item }: { item: Island }) => {
    const isVisited = visited.includes(item.id);
    const name = localizedIslandName(item, language);
    const description = localizedIslandDescription(item, language);

    return (
      <View
        style={{
          backgroundColor: palette.surface,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.hairline,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: 64, height: 64, borderRadius: 16 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: palette.creamDeep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="boat-outline" size={22} color={palette.violetText} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: palette.ink }}>
            {name}
          </Text>
          {description && (
            <Text
              style={{ marginTop: 4, fontSize: 12, color: palette.inkMuted }}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => handleToggle(item)}
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
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={countryName}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      {loading && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={palette.brand} />
          <Text style={{ marginTop: 12, color: palette.inkMuted }}>
            {t("islandsCountry.loading")}
          </Text>
        </View>
      )}

      {!loading && islands.length === 0 && (
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
            {t("islandsCountry.empty")}
          </Text>
        </View>
      )}

      {!loading && islands.length > 0 && (
        <>
          <ProgressCard
            label={t("islandsCountry.visited")}
            detail={t("explore.progressDetail", {
              count: visitedInCountry,
              total: islands.length,
            })}
            percent={percent}
            accentBg={categoryMeta?.bg}
            accentFg={categoryMeta?.fg}
          />

          <FlatList
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
            data={islands}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        </>
      )}
    </View>
  );
}
