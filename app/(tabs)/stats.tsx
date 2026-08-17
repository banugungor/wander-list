import { BottomTabBar } from "@/components/bottom-tab-bar";
import { StatCard } from "@/components/stat-card";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { ActivityEntry, getActivityLog } from "@/data/activityLog";
import {
  CUISINE_VISITED_KEY,
  HERITAGE_VISITED_KEY,
} from "@/data/heritageStorage";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

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
  const [cuisineCount, setCuisineCount] = useState(0);
  const [placesCount, setPlacesCount] = useState(0);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [heritageRaw, cuisineRaw, placesRaw, log] = await Promise.all([
          AsyncStorage.getItem(HERITAGE_VISITED_KEY),
          AsyncStorage.getItem(CUISINE_VISITED_KEY),
          AsyncStorage.getItem(PLACES_VISITED_KEY),
          getActivityLog(),
        ]);
        setHeritageCount(heritageRaw ? JSON.parse(heritageRaw).length : 0);
        setCuisineCount(cuisineRaw ? JSON.parse(cuisineRaw).length : 0);
        setPlacesCount(placesRaw ? JSON.parse(placesRaw).length : 0);
        setActivity(log);
      };
      load();
    }, []),
  );

  const weekly = useMemo(() => bucketByWeek(activity), [activity]);
  const maxWeekly = Math.max(1, ...weekly);

  const heritage = getCategory("heritage")!;
  const cuisine = getCategory("cuisine")!;
  const places = getCategory("places")!;
  const books = getCategory("books")!;
  const movies = getCategory("movies")!;

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
          {t("stats.title")}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 13, color: palette.inkMuted }}>
          {t("stats.subtitle")}
        </Text>

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
            label={t(books.titleKey)}
            value={0}
            icon={books.icon}
            bg={books.bg}
            fg={books.fg}
          />
          <StatCard
            label={t(movies.titleKey)}
            value={0}
            icon={movies.icon}
            bg={movies.bg}
            fg={movies.fg}
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

      <BottomTabBar />
    </View>
  );
}
