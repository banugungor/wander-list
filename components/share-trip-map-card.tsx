import { TripMap } from "@/components/trip-map";
import {
  SHARE_STORY_CARD_HEIGHT,
  SHARE_STORY_CARD_WIDTH,
} from "@/components/share-story-card";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import type { CityMap } from "@/data/cityMaps";
import type { TripStop } from "@/data/tripStops";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { forwardRef } from "react";
import { Text, View } from "react-native";

const CARD_PADDING = 16;
const MAP_WIDTH = SHARE_STORY_CARD_WIDTH - CARD_PADDING * 2;
const MAP_HEIGHT = 380;

type ShareTripMapCardProps = {
  title: string;
  /** Pre-formatted date range, or null. */
  dates: string | null;
  map: CityMap;
  stops: TripStop[];
  /** `mapIconKey` → icon URL (data/mapIcons.ts). */
  icons: Record<string, string>;
  dayCount: number;
};

// Same 9:16 story canvas as the other share cards (see ShareStoryCard for why
// 360×640), rendered off-screen and captured by shareStory.ts. The headline
// is the trip's own title rather than a sentence, because Turkish suffixes
// change with the word.
export const ShareTripMapCard = forwardRef<View, ShareTripMapCardProps>(
  function ShareTripMapCard({ title, dates, map, stops, icons, dayCount }, ref) {
    const { t } = useLanguage();

    return (
      <View
        ref={ref}
        collapsable={false}
        style={{
          width: SHARE_STORY_CARD_WIDTH,
          height: SHARE_STORY_CARD_HEIGHT,
          overflow: "hidden",
          backgroundColor: palette.cream,
          paddingHorizontal: CARD_PADDING,
          // Clear of the Instagram Stories header and reply bar.
          paddingTop: 52,
          paddingBottom: 36,
          justifyContent: "space-between",
        }}
      >
        <View>
          <Image
            source={require("@/assets/images/wanderlist.png")}
            style={{ width: 40, height: 40 }}
            contentFit="contain"
          />
          <Text
            numberOfLines={2}
            style={{ marginTop: 14, fontSize: 28, fontWeight: "800", color: palette.ink }}
          >
            {title}
          </Text>
          {dates ? (
            <Text style={{ marginTop: 4, fontSize: 14, color: palette.inkMuted }}>{dates}</Text>
          ) : null}
        </View>

        <View>
          <TripMap
            map={map}
            stops={stops}
            icons={icons}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            labelMode="fit"
            pinSize={22}
            style={{ borderRadius: 24, borderWidth: 1, borderColor: palette.hairlineStrong }}
          />
          <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
            <StatPill icon="location" label={t("trips.mapStops", { count: stops.length })} />
            {dayCount > 0 ? (
              <StatPill icon="calendar" label={t("trips.daysCount", { count: dayCount })} />
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="airplane" size={16} color={palette.inkMuted} />
          <Text style={{ fontSize: 13, color: palette.inkMuted }}>
            {t("stats.shareCardFooter")}
          </Text>
        </View>
      </View>
    );
  },
);

function StatPill({ icon, label }: { icon: "location" | "calendar"; label: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: palette.greenSoft,
      }}
    >
      <Ionicons name={icon} size={15} color={palette.greenText} />
      <Text style={{ fontSize: 13, fontWeight: "700", color: palette.greenText }}>{label}</Text>
    </View>
  );
}
