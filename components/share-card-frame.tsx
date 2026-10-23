import {
  SHARE_STORY_CARD_HEIGHT,
  SHARE_STORY_CARD_WIDTH,
} from "@/components/share-story-card";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, type ReactNode } from "react";
import { Text, View } from "react-native";

type Props = {
  title: string;
  children: ReactNode;
};

/** Shared 9:16 dark canvas for the profile share cards (passport, year,
 * traveler card): logo + title on top, the card's own content in the middle,
 * the "Exploring with Wanderlist" footer at the bottom. Same size and look as
 * ShareStoryCard / ShareWorldCard, which keep their own inline layout. */
export const ShareCardFrame = forwardRef<View, Props>(function ShareCardFrame(
  { title, children },
  ref,
) {
  const { t } = useLanguage();

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

        {children}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="airplane" size={16} color={palette.onDarkMuted} />
          <Text style={{ fontSize: 13, color: palette.onDarkMuted }}>
            {t("stats.shareCardFooter")}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
});
