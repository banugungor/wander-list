import { BadgeTile } from "@/components/badge-tile";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import type { CategoryId } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { type Badge, type BadgeContext, computeBadges } from "@/data/badges";
import { fetchCuisines } from "@/data/cuisineApi";
import { heritageSites } from "@/data/heritageSites";
import {
  CUISINE_MEAL_AREAS_KEY,
  CUISINE_VISITED_KEY,
  HERITAGE_VISITED_KEY,
  PLACES_VISITED_KEY,
} from "@/data/storageKeys";
import { getTitleKey } from "@/data/titles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const SECTIONS: {
  labelKey: string;
  idPrefix: string;
  titleCategoryId?: CategoryId;
}[] = [
  { labelKey: "category.heritage", idPrefix: "heritage_", titleCategoryId: "heritage" },
  { labelKey: "category.places", idPrefix: "places_", titleCategoryId: "places" },
  { labelKey: "badges.continents", idPrefix: "continent_" },
  { labelKey: "category.cuisine", idPrefix: "cuisine_", titleCategoryId: "cuisine" },
];

export default function BadgesScreen() {
  const { t } = useLanguage();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [ctx, setCtx] = useState<BadgeContext | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [heritageRaw, placesRaw, cuisineRaw, cuisineMealAreasRaw, cuisines] =
          await Promise.all([
            AsyncStorage.getItem(HERITAGE_VISITED_KEY),
            AsyncStorage.getItem(PLACES_VISITED_KEY),
            AsyncStorage.getItem(CUISINE_VISITED_KEY),
            AsyncStorage.getItem(CUISINE_MEAL_AREAS_KEY),
            fetchCuisines().catch(() => []),
          ]);

        const nextCtx: BadgeContext = {
          heritageVisitedCount: heritageRaw ? JSON.parse(heritageRaw).length : 0,
          heritageTotal: heritageSites.length,
          countriesVisitedIds: placesRaw ? JSON.parse(placesRaw) : [],
          cuisineVisitedMealIds: cuisineRaw ? JSON.parse(cuisineRaw) : [],
          cuisineMealAreas: cuisineMealAreasRaw
            ? JSON.parse(cuisineMealAreasRaw)
            : {},
          cuisineTotalAreas: cuisines.length,
        };
        setCtx(nextCtx);
        setBadges(computeBadges(nextCtx));
      };
      load();
    }, []),
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 64,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 20, fontWeight: "700", color: palette.ink }}>
          {t("badges.title")}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 13, color: palette.inkMuted }}>
          {t("badges.subtitle")}
        </Text>

        {SECTIONS.map((section) => {
          const sectionBadges = badges.filter((b) =>
            b.id.startsWith(section.idPrefix),
          );
          if (sectionBadges.length === 0) return null;

          const titleKey =
            ctx && section.titleCategoryId
              ? getTitleKey(section.titleCategoryId, ctx)
              : null;

          return (
            <View key={section.idPrefix}>
              <Text
                style={{
                  marginTop: 26,
                  marginBottom: 14,
                  fontSize: 11,
                  fontWeight: "700",
                  color: palette.inkMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                {t(section.labelKey)}
                {titleKey ? (
                  <Text style={{ color: palette.brand }}> · {t(titleKey)}</Text>
                ) : null}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {sectionBadges.map((badge) => (
                  <BadgeTile key={badge.id} badge={badge} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}
