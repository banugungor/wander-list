import { BadgeTile } from "@/components/badge-tile";
import { SectionLabel } from "@/components/section-label";
import type { CategoryId } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import type { Badge, BadgeContext } from "@/data/badges";
import { getTitleKey } from "@/data/titles";
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

// Full badge grid on the profile screen (app/(tabs)/me.tsx), which computes
// `badges`/`ctx` once and also feeds them to the showcase above it.
export function BadgesSection({
  badges,
  ctx,
}: {
  badges: Badge[];
  ctx: BadgeContext | null;
}) {
  const { t } = useLanguage();

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
            <SectionLabel>
              {t(section.labelKey)}
              {titleKey ? (
                <Text style={{ color: palette.brand }}> · {t(titleKey)}</Text>
              ) : null}
            </SectionLabel>
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
