import { BadgesSection } from "@/components/badges-section";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { OffscreenShareCard } from "@/components/offscreen-share-card";
import { SharePillButton } from "@/components/share-pill-button";
import { ShareStoryCard } from "@/components/share-story-card";
import { StatCard } from "@/components/stat-card";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { ActivityEntry, getActivityLog } from "@/data/activityLog";
import { HERITAGE_VISITED_KEY } from "@/data/heritageStorage";
import { parseIdList } from "@/data/parseIdList";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import { CUISINE_VISITED_KEY, ISLANDS_VISITED_KEY } from "@/data/storageKeys";
import { useShareStory } from "@/hooks/use-share-story";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type Segment = "stats" | "badges";

const SEGMENTS: { id: Segment; labelKey: string; subtitleKey: string }[] = [
  { id: "stats", labelKey: "stats.title", subtitleKey: "stats.subtitle" },
  { id: "badges", labelKey: "badges.title", subtitleKey: "badges.subtitle" },
];

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
  const [segment, setSegment] = useState<Segment>("stats");
  const { cardRef: shareCardRef, sharing, share: handleShare } = useShareStory();

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [heritageRaw, placesRaw, cuisineRaw, islandsRaw, log] =
            await Promise.all([
              AsyncStorage.getItem(HERITAGE_VISITED_KEY),
              AsyncStorage.getItem(PLACES_VISITED_KEY),
              AsyncStorage.getItem(CUISINE_VISITED_KEY),
              AsyncStorage.getItem(ISLANDS_VISITED_KEY),
              getActivityLog(),
            ]);
          setHeritageCount(parseIdList(heritageRaw).length);
          setPlacesCount(parseIdList(placesRaw).length);
          setCuisineCount(parseIdList(cuisineRaw).length);
          setIslandsCount(parseIdList(islandsRaw).length);
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
            <Text
              style={{ fontSize: 20, fontWeight: "700", color: palette.ink }}
            >
              {t("stats.pageTitle")}
            </Text>
            <Text
              style={{ marginTop: 4, fontSize: 13, color: palette.inkMuted }}
            >
              {t(SEGMENTS.find((s) => s.id === segment)!.subtitleKey)}
            </Text>
          </View>

          {segment === "stats" ? (
            <SharePillButton
              label={t("stats.shareButton")}
              onPress={handleShare}
              loading={sharing}
            />
          ) : null}
        </View>

        <View
          style={{
            marginTop: 18,
            flexDirection: "row",
            padding: 4,
            borderRadius: 999,
            backgroundColor: palette.creamDeep,
          }}
        >
          {SEGMENTS.map((s) => {
            const active = s.id === segment;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSegment(s.id)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? palette.surface : "transparent",
                  shadowColor: palette.shadow,
                  shadowOpacity: active ? 0.08 : 0,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: active ? 1 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: active ? palette.ink : palette.inkMuted,
                  }}
                >
                  {t(s.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {segment === "badges" ? (
          <BadgesSection />
        ) : (
          <>
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
            <Text
              style={{ marginTop: 8, fontSize: 11, color: palette.inkFaint }}
            >
              {t("stats.lastNWeeks", { n: WEEKS })}
            </Text>
          </>
        )}
      </ScrollView>

      {/* Never shown, only captured by useShareStory's share(). */}
      <OffscreenShareCard>
        <ShareStoryCard
          ref={shareCardRef}
          heritageCount={heritageCount}
          placesCount={placesCount}
          cuisineCount={cuisineCount}
          islandsCount={islandsCount}
          title={t("stats.shareCardTitle")}
          footer={t("stats.shareCardFooter")}
        />
      </OffscreenShareCard>

      <BottomTabBar />
    </View>
  );
}
