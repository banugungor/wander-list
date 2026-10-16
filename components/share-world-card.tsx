import { CountryFlag } from "@/components/country-flag";
import {
  SHARE_STORY_CARD_HEIGHT,
  SHARE_STORY_CARD_WIDTH,
} from "@/components/share-story-card";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef } from "react";
import { Text, View } from "react-native";

const MAX_FLAGS = 24;

export type ShareWorldFlag = { id: string; iso2?: string };

type ShareWorldCardProps = {
  visitedCount: number;
  totalCount: number;
  continentCount: number;
  totalContinents: number;
  flags: ShareWorldFlag[];
};

// Under 10% a whole-number percent hides most of the progress (1–9 of 240
// countries all round to 0–4%), so show one decimal there.
function formatPercent(visited: number, total: number, language: string): string {
  const raw = total > 0 ? (visited / total) * 100 : 0;
  const number =
    raw < 10
      ? raw.toFixed(1).replace(".", language === "tr" ? "," : ".")
      : String(Math.round(raw));
  return language === "tr" ? `%${number}` : `${number}%`;
}

// Same 9:16 story canvas as ShareStoryCard (see there for why 360×640),
// rendered off-screen and captured by shareStory.ts. The headline is a
// standalone "%N" rather than a sentence, because Turkish suffixes after a
// number change with the number ("%6'sı", "%5'i", "%10'u").
export const ShareWorldCard = forwardRef<View, ShareWorldCardProps>(
  function ShareWorldCard(
    { visitedCount, totalCount, continentCount, totalContinents, flags },
    ref,
  ) {
    const { t, language } = useLanguage();
    const percentValue = totalCount > 0 ? (visitedCount / totalCount) * 100 : 0;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={{
          width: SHARE_STORY_CARD_WIDTH,
          height: SHARE_STORY_CARD_HEIGHT,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={[palette.cardDarkFrom, palette.cardDarkTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 56,
            paddingBottom: 40,
            justifyContent: "space-between",
          }}
        >
          <View>
            <Image
              source={require("@/assets/images/wanderlist.png")}
              style={{ width: 56, height: 56 }}
              contentFit="contain"
            />
            <Text
              style={{
                marginTop: 20,
                fontSize: 26,
                fontWeight: "700",
                color: palette.onDark,
              }}
            >
              {t("shareWorld.title")}
            </Text>
          </View>

          <View>
            <Text
              style={{
                fontSize: 84,
                lineHeight: 92,
                fontWeight: "800",
                color: palette.onDark,
              }}
            >
              {formatPercent(visitedCount, totalCount, language)}
            </Text>
            <Text style={{ fontSize: 14, color: palette.onDarkMuted }}>
              {t("shareWorld.explored")}
            </Text>

            <View
              style={{
                marginTop: 14,
                height: 8,
                borderRadius: 4,
                backgroundColor: palette.onDarkTrack,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.min(100, Math.max(visitedCount > 0 ? 2 : 0, percentValue))}%`,
                  height: "100%",
                  borderRadius: 4,
                  backgroundColor: palette.brand,
                }}
              />
            </View>

            <View style={{ marginTop: 18, gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="earth" size={18} color={palette.onDark} />
                <Text style={{ fontSize: 16, fontWeight: "700", color: palette.onDark }}>
                  {t("shareWorld.countries", {
                    count: visitedCount,
                    total: totalCount,
                  })}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="compass-outline" size={18} color={palette.onDark} />
                <Text style={{ fontSize: 16, fontWeight: "700", color: palette.onDark }}>
                  {t("shareWorld.continents", {
                    count: continentCount,
                    total: totalContinents,
                  })}
                </Text>
              </View>
            </View>

            <View
              style={{
                marginTop: 18,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {flags.slice(0, MAX_FLAGS).map((f) => (
                <CountryFlag key={f.id} id={f.id} iso2={f.iso2} size={22} />
              ))}
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="airplane" size={16} color={palette.onDarkMuted} />
            <Text style={{ fontSize: 13, color: palette.onDarkMuted }}>
              {t("stats.shareCardFooter")}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  },
);
