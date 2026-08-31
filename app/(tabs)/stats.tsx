import { BottomTabBar } from "@/components/bottom-tab-bar";
import { ShareStoryCard } from "@/components/share-story-card";
import { StatCard } from "@/components/stat-card";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { ActivityEntry, getActivityLog } from "@/data/activityLog";
import { HERITAGE_VISITED_KEY } from "@/data/heritageStorage";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import { shareStatsToInstagramStory } from "@/data/shareStory";
import { CUISINE_VISITED_KEY, ISLANDS_VISITED_KEY } from "@/data/storageKeys";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const WEEKS = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function bucketByWeek(entries: ActivityEntry[]): number[] {
  const now = Date.now();
  const buckets = new Array(WEEKS).fill(0);

  entries.forEach((entry) => {
    const age = now - entry.timestamp;
    const weekIndex = Math.floor(age / WEEK_MS);
    const bucket = WEEKS - 1 - weekIndex;
    if (bucket >= 0 && bucket < WEEKS) {
      buckets[bucket] += 1;
    }
  });

  return buckets;
}

export default function StatsScreen() {
  const { t } = useLanguage();
  const [heritageCount, setHeritageCount] = useState(0);
  const [placesCount, setPlacesCount] = useState(0);
  const [cuisineCount, setCuisineCount] = useState(0);
  const [islandsCount, setIslandsCount] = useState(0);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<View>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [heritageRaw, placesRaw, cuisineRaw, islandsRaw, log] = await Promise.all([
            AsyncStorage.getItem(HERITAGE_VISITED_KEY),
            AsyncStorage.getItem(PLACES_VISITED_KEY),
            AsyncStorage.getItem(CUISINE_VISITED_KEY),
            AsyncStorage.getItem(ISLANDS_VISITED_KEY),
            getActivityLog(),
          ]);
          setHeritageCount(heritageRaw ? JSON.parse(heritageRaw).length : 0);
          setPlacesCount(placesRaw ? JSON.parse(placesRaw).length : 0);
          setCuisineCount(cuisineRaw ? JSON.parse(cuisineRaw).length : 0);
          setIslandsCount(islandsRaw ? JSON.parse(islandsRaw).length : 0);
          setActivity(log);
        } catch (e) {
          console.log("STATS LOAD ERROR", e);
        }
      };
      load();
    }, []),
  );

  const weekly = useMemo(() => bucketByWeek(activity), [activity]);
  const maxWeekly = Math.max(1, ...weekly);

  const heritage = getCategory("heritage")!;
  const cuisine = getCategory("cuisine")!;
  const places = getCategory("places")!;
  const islands = getCategory("islands")!;
  const capitals = getCategory("capitals")!;

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareStatsToInstagramStory(shareCardRef);
    } catch (e) {
      console.log("SHARE STORY ERROR", e);
      Alert.alert(t("stats.shareErrorTitle"), t("stats.shareError"));
    } finally {
      setSharing(false);
    }
  };

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
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: palette.ink }}>
              {t("stats.title")}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: palette.inkMuted }}>
              {t("stats.subtitle")}
            </Text>
          </View>

          <Pressable
            onPress={handleShare}
            disabled={sharing}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: palette.greenSoft,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={palette.greenText} />
            ) : (
              <Ionicons name="share-social-outline" size={15} color={palette.greenText} />
            )}
            <Text style={{ fontSize: 12, fontWeight: "600", color: palette.greenText }}>
              {t("stats.shareButton")}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            marginTop: 20,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <StatCard
            label={t(heritage.titleKey)}
            value={heritageCount}
            icon={heritage.icon}
            bg={heritage.bg}
            fg={heritage.fg}
          />
          <StatCard
            label={t(cuisine.titleKey)}
            value={cuisineCount}
            icon={cuisine.icon}
            bg={cuisine.bg}
            fg={cuisine.fg}
          />
          <StatCard
            label={t(places.titleKey)}
            value={placesCount}
            icon={places.icon}
            bg={places.bg}
            fg={places.fg}
          />
          <StatCard
            label={t(islands.titleKey)}
            value={islandsCount}
            icon={islands.icon}
            bg={islands.bg}
            fg={islands.fg}
          />
          <StatCard
            label={t(capitals.titleKey)}
            value={0}
            icon={capitals.icon}
            bg={capitals.bg}
            fg={capitals.fg}
          />
        </View>

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
          {t("stats.weeklyActivity")}
        </Text>

        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            height: 110,
            shadowColor: palette.shadow,
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 1,
          }}
        >
          {weekly.map((count, i) => (
            <View key={i} style={{ alignItems: "center", flex: 1 }}>
              <View
                style={{
                  width: 12,
                  height: Math.max(4, (count / maxWeekly) * 70),
                  borderRadius: 6,
                  backgroundColor:
                    count > 0 ? palette.brand : palette.creamDeep,
                }}
              />
            </View>
          ))}
        </View>
        <Text style={{ marginTop: 8, fontSize: 11, color: palette.inkFaint }}>
          {t("stats.lastNWeeks", { n: WEEKS })}
        </Text>
      </ScrollView>

      {/* Off-screen — never shown, only captured by shareStatsToInstagramStory
       * via shareCardRef. Positioned instead of unmounted so the ref is
       * always ready by the time the share button is tapped. */}
      <View
        style={{ position: "absolute", top: 0, left: -9999 }}
        pointerEvents="none"
      >
        <ShareStoryCard
          ref={shareCardRef}
          heritageCount={heritageCount}
          placesCount={placesCount}
          cuisineCount={cuisineCount}
          islandsCount={islandsCount}
          title={t("stats.shareCardTitle")}
          footer={t("stats.shareCardFooter")}
        />
      </View>

      <BottomTabBar />
    </View>
  );
}
