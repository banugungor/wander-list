import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCityName } from "@/data/cityNamesTr";
import type { HeritageItem } from "@/data/heritageSites";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type Props = {
  item: Pick<HeritageItem, "category" | "city">;
  marginTop?: number;
};

// Cultural/Mixed keep the violet pill; Natural is green so it reads at a
// glance in a long list of otherwise-identical rows.
const CATEGORY_COLORS = {
  Cultural: { bg: palette.violetSoft, fg: palette.violet },
  Mixed: { bg: palette.violetSoft, fg: palette.violet },
  Natural: { bg: palette.greenSoft, fg: palette.greenText },
} as const;

/** The category pill (Kültürel/Doğal/Karma) plus, when the site has one, a
 * city pill beside it. Shared by the heritage list, detail and explore
 * screens so they can't drift apart. Renders nothing when neither exists. */
export function HeritageBadges({ item, marginTop = 8 }: Props) {
  const { t, language } = useLanguage();
  const { category, city } = item;
  if (!category && !city) return null;

  const colors = category ? CATEGORY_COLORS[category] : null;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        marginTop,
      }}
    >
      {category && colors && (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: colors.bg,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.fg,
              letterSpacing: 0.5,
            }}
          >
            {t(`heritageCategory.${category.toLowerCase()}`).toUpperCase()}
          </Text>
        </View>
      )}

      {city && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: palette.cream,
            borderWidth: 1,
            borderColor: palette.hairline,
          }}
        >
          <Ionicons name="location-outline" size={11} color={palette.inkMuted} />
          <Text
            style={{ fontSize: 11, fontWeight: "600", color: palette.inkMuted }}
          >
            {getLocalizedCityName(city, language)}
          </Text>
        </View>
      )}
    </View>
  );
}
