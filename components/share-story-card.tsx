import { StatCard } from "@/components/stat-card";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { forwardRef } from "react";
import { Text, View } from "react-native";

// Instagram Stories canvas is 1080×1920 (9:16). Authoring at a third of that
// (360×640) keeps the numbers easy to read while editing; shareStory.ts's
// captureRef call upscales the capture to the full 1080×1920 output size, so
// this ratio must stay exactly 9:16.
export const SHARE_STORY_CARD_WIDTH = 360;
export const SHARE_STORY_CARD_HEIGHT = 640;

type ShareStoryCardProps = {
  heritageCount: number;
  placesCount: number;
  cuisineCount: number;
  islandsCount: number;
  title: string;
  footer: string;
};

// StatCard's dark-card overrides, shared by all four tiles below.
const darkStatCardProps = {
  bg: palette.onDarkTrack,
  fg: palette.onDarkMuted,
  iconColor: palette.onDark,
  iconBadgeBg: "rgba(255,255,255,0.18)",
  valueColor: palette.onDark,
};

// Rendered off-screen (see shareStory.ts) and captured with
// react-native-view-shot into the PNG handed to Instagram Stories — never
// shown to the user directly, so it doesn't need to be responsive or handle
// interaction, just look good as a static image.
export const ShareStoryCard = forwardRef<View, ShareStoryCardProps>(
  function ShareStoryCard(
    { heritageCount, placesCount, cuisineCount, islandsCount, title, footer },
    ref,
  ) {
    const { t } = useLanguage();
    const heritage = getCategory("heritage")!;
    const places = getCategory("places")!;
    const cuisine = getCategory("cuisine")!;
    const islands = getCategory("islands")!;

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
              {title}
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <StatCard
              {...darkStatCardProps}
              icon={heritage.icon}
              value={heritageCount}
              label={t(heritage.titleKey)}
            />
            <StatCard
              {...darkStatCardProps}
              icon={places.icon}
              value={placesCount}
              label={t(places.titleKey)}
            />
            <StatCard
              {...darkStatCardProps}
              icon={cuisine.icon}
              value={cuisineCount}
              label={t(cuisine.titleKey)}
            />
            <StatCard
              {...darkStatCardProps}
              icon={islands.icon}
              value={islandsCount}
              label={t(islands.titleKey)}
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="airplane" size={16} color={palette.onDarkMuted} />
            <Text style={{ fontSize: 13, color: palette.onDarkMuted }}>{footer}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  },
);
