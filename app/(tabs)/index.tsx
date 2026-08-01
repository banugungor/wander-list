import { BottomTabBar } from "@/components/bottom-tab-bar";
import { CategoryTile } from "@/components/category-tile";
import { CircularProgress } from "@/components/circular-progress";
import { categories, getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { ActivityEntry, getActivityLog, timeAgo } from "@/data/activityLog";
import {
  CUISINE_AREA_TOTALS_KEY,
  CUISINE_VISITED_KEY,
  HERITAGE_DATA_CACHE_KEY,
  HERITAGE_TOTAL_COUNT_KEY,
  HERITAGE_VISITED_KEY,
} from "@/data/heritageStorage";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import worldData from "@/data/worldCountries.json";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

type CategoryStats = { count: number; total: number; percent: number };

const emptyStats: CategoryStats = { count: 0, total: 0, percent: 0 };

export default function HomeScreen() {
  const [stats, setStats] = useState<Record<string, CategoryStats>>({});
  const [recent, setRecent] = useState<ActivityEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const visitedData = await AsyncStorage.getItem(HERITAGE_VISITED_KEY);
          const visited: string[] = visitedData ? JSON.parse(visitedData) : [];

          const [cachedTotalCountData, cachedData] = await Promise.all([
            AsyncStorage.getItem(HERITAGE_TOTAL_COUNT_KEY),
            AsyncStorage.getItem(HERITAGE_DATA_CACHE_KEY),
          ]);
          const cachedTotalCount = cachedTotalCountData
            ? JSON.parse(cachedTotalCountData)
            : 0;
          const cached = cachedData ? JSON.parse(cachedData) : [];

          const heritageTotal =
            typeof cachedTotalCount === "number" && cachedTotalCount > 0
              ? cachedTotalCount
              : cached.length;
          const heritagePercent =
            heritageTotal > 0
              ? Math.min(100, Math.round((visited.length / heritageTotal) * 100))
              : 0;

          const [visitedMealsData, areaTotalsData] = await Promise.all([
            AsyncStorage.getItem(CUISINE_VISITED_KEY),
            AsyncStorage.getItem(CUISINE_AREA_TOTALS_KEY),
          ]);
          const visitedMeals: string[] = visitedMealsData
            ? JSON.parse(visitedMealsData)
            : [];
          const areaTotals = areaTotalsData ? JSON.parse(areaTotalsData) : {};
          const totalMeals = Object.values(areaTotals).reduce(
            (sum: number, c: any) => sum + c,
            0,
          );
          const cuisinePercent =
            totalMeals > 0
              ? Math.min(100, Math.round((visitedMeals.length / totalMeals) * 100))
              : 0;

          const placesVisitedData = await AsyncStorage.getItem(PLACES_VISITED_KEY);
          const visitedCountries: string[] = placesVisitedData
            ? JSON.parse(placesVisitedData)
            : [];
          const placesTotal = worldData.countries.length;
          const placesPercent =
            placesTotal > 0
              ? Math.min(100, Math.round((visitedCountries.length / placesTotal) * 100))
              : 0;

          setStats({
            heritage: {
              count: visited.length,
              total: heritageTotal,
              percent: heritagePercent,
            },
            cuisine: {
              count: visitedMeals.length,
              total: totalMeals,
              percent: cuisinePercent,
            },
            places: {
              count: visitedCountries.length,
              total: placesTotal,
              percent: placesPercent,
            },
          });

          const log = await getActivityLog();
          setRecent(log.slice(0, 3));
        } catch (e) {
          console.log("home load error", e);
        }
      };

      load();
    }, []),
  );

  const implementedStats = Object.values(stats).filter((s) => s.total > 0);
  const overallPercent =
    implementedStats.length > 0
      ? Math.round(
          implementedStats.reduce((sum, s) => sum + s.percent, 0) /
            implementedStats.length,
        )
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* GREETING */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontSize: 18, fontWeight: "600", color: palette.ink }}>
              Merhaba, Banu
            </Text>
            <Text style={{ marginTop: 3, fontSize: 13, color: palette.inkMuted }}>
              Bugün ne biriktirdin?
            </Text>
          </View>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: palette.creamDeep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: palette.brand }}>
              B
            </Text>
          </View>
        </View>

        {/* OVERALL PROGRESS */}
        <View
          style={{
            marginTop: 20,
            backgroundColor: palette.surface,
            borderRadius: 18,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            shadowColor: palette.shadow,
            shadowOpacity: 0.06,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
          }}
        >
          <CircularProgress percent={overallPercent} size={64} strokeWidth={7} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: palette.inkMuted,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Genel ilerleme
            </Text>
            {implementedStats.length === 0 ? (
              <Text style={{ marginTop: 6, fontSize: 12, color: palette.inkMuted }}>
                Henüz veri yok, keşfetmeye başla
              </Text>
            ) : (
              categories
                .filter((c) => stats[c.id] && stats[c.id].total > 0)
                .map((c) => (
                  <View
                    key={c.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    <Ionicons name={c.icon} size={12} color={c.fg} />
                    <Text style={{ fontSize: 12, color: palette.ink }}>
                      {c.title} {stats[c.id].count}/{stats[c.id].total}
                    </Text>
                  </View>
                ))
            )}
          </View>
        </View>

        {/* CATEGORY GRID */}
        <Text
          style={{
            marginTop: 26,
            marginBottom: 10,
            fontSize: 11,
            fontWeight: "700",
            color: palette.inkMuted,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          Kategoriler
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {categories.map((cat) => {
            const s = stats[cat.id] ?? emptyStats;
            return (
              <CategoryTile
                key={cat.id}
                category={cat}
                count={s.count}
                total={s.total}
                onPress={() =>
                  cat.id === "places"
                    ? router.push("/places-map")
                    : router.push({
                        pathname: "/explore",
                        params: { type: cat.id },
                      })
                }
              />
            );
          })}
        </View>

        {/* RECENT ACTIVITY */}
        {recent.length > 0 && (
          <>
            <Text
              style={{
                marginTop: 26,
                marginBottom: 10,
                fontSize: 11,
                fontWeight: "700",
                color: palette.inkMuted,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Son eklenenler
            </Text>
            {recent.map((entry, i) => {
              const cat = getCategory(entry.type);
              return (
                <View
                  key={`${entry.type}-${entry.id}-${i}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 10,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: cat?.bg ?? palette.creamDeep,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={cat?.icon ?? "checkmark"}
                      size={16}
                      color={cat?.fg ?? palette.brand}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: palette.ink }}
                      numberOfLines={1}
                    >
                      {entry.title}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 11, color: palette.inkMuted }}>
                      {cat?.title ?? ""} · {timeAgo(entry.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}
