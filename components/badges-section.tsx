import { BadgeTile } from "@/components/badge-tile";
import type { CategoryId } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { type Badge, type BadgeContext, computeBadges } from "@/data/badges";
import { heritageSites } from "@/data/heritageSites";
import { parseIdList } from "@/data/parseIdList";
import { HERITAGE_VISITED_KEY, PLACES_VISITED_KEY } from "@/data/storageKeys";
import { getTitleKey } from "@/data/titles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

const SECTIONS: {
  labelKey: string;
  idPrefix: string;
  titleCategoryId?: CategoryId;
}[] = [
  { labelKey: "category.heritage", idPrefix: "heritage_", titleCategoryId: "heritage" },
  { labelKey: "category.places", idPrefix: "places_", titleCategoryId: "places" },
  { labelKey: "badges.continents", idPrefix: "continent_" },
];

// Badge grid rendered as the "Rozetler" segment of the Stats tab
// (app/(tabs)/stats.tsx) — it used to be its own /badges tab.
export function BadgesSection() {
  const { t } = useLanguage();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [ctx, setCtx] = useState<BadgeContext | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [heritageRaw, placesRaw] = await Promise.all([
          AsyncStorage.getItem(HERITAGE_VISITED_KEY),
          AsyncStorage.getItem(PLACES_VISITED_KEY),
        ]);

        const nextCtx: BadgeContext = {
          heritageVisitedCount: parseIdList(heritageRaw).length,
          heritageTotal: heritageSites.length,
          countriesVisitedIds: parseIdList(placesRaw),
        };
        setCtx(nextCtx);
        setBadges(computeBadges(nextCtx));
      };
      load().catch((e) => console.log("BADGES LOAD ERROR", e));
    }, []),
  );

  return (
    <View>
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
    </View>
  );
}
