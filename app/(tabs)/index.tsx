import { BottomTabBar } from "@/components/bottom-tab-bar";
import { CategoryTile } from "@/components/category-tile";
import { CircularProgress } from "@/components/circular-progress";
import { CountryFlag } from "@/components/country-flag";
import { categories, getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { ActivityEntry, getActivityLog, timeAgo } from "@/data/activityLog";
import { heritageSites } from "@/data/heritageSites";
import {
  CUISINE_AREA_TOTALS_KEY,
  CUISINE_VISITED_KEY,
  HERITAGE_VISITED_KEY,
} from "@/data/heritageStorage";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import worldData from "@/data/worldCountries.json";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type CategoryStats = { count: number; total: number; percent: number };

const emptyStats: CategoryStats = { count: 0, total: 0, percent: 0 };

const categoryRows = categories.reduce<(typeof categories)[]>((rows, cat, i) => {
  const isLastOdd = i === categories.length - 1 && categories.length % 2 === 1;
  if (isLastOdd) {
    rows.push([cat]);
  } else if (i % 2 === 0) {
    rows.push([cat]);
  } else {
    rows[rows.length - 1].push(cat);
  }
  return rows;
}, []);

export default function HomeScreen() {
  const [stats, setStats] = useState<Record<string, CategoryStats>>({});
  const [recent, setRecent] = useState<ActivityEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const visitedData = await AsyncStorage.getItem(HERITAGE_VISITED_KEY);
          const visited: string[] = visitedData ? JSON.parse(visitedData) : [];

          const heritageTotal = heritageSites.length;
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
              Merhaba 👋
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
        <Pressable
          onPress={() => router.push("/stats")}
          style={({ pressed }) => [{ marginTop: 20 }, pressed && { opacity: 0.9 }]}
        >
          <View
            style={{
              borderRadius: 18,
              padding: 16,
              minHeight: 140,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              overflow: "hidden",
              backgroundColor: palette.cardDarkTo,
              shadowColor: palette.shadow,
              shadowOpacity: 0.18,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }}
          >
            <Image
              source={require("@/assets/decor/progress-card.png")}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                left: "32%",
              }}
              contentFit="cover"
            />
            <LinearGradient
              colors={[palette.cardDarkFrom, `${palette.cardDarkTo}00`]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: "100%",
              }}
            />
            <CircularProgress
              percent={overallPercent}
              size={64}
              strokeWidth={7}
              trackColor={palette.onDarkTrack}
              textColor={palette.onDark}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: palette.surface,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                Genel İlerleme
              </Text>
              {implementedStats.length === 0 ? (
                <Text style={{ marginTop: 6, fontSize: 12, color: palette.onDarkMuted }}>
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
                      <Ionicons name={c.icon} size={16} color={c.fg} />
                      <Text style={{ fontSize: 12, color: palette.onDark }}>
                        {c.title}{" "}
                        <Text style={{ fontWeight: "700", color: c.fg }}>
                          {stats[c.id].count}/{stats[c.id].total}
                        </Text>
                      </Text>
                    </View>
                  ))
              )}
            </View>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-forward" size={16} color={palette.onDark} />
            </View>
          </View>
        </Pressable>

        {/* CATEGORY GRID */}
        <View
          style={{
            marginTop: 26,
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: palette.inkMuted,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            Kategoriler
          </Text>
          <Pressable
            onPress={() => router.push("/explore")}
            style={({ pressed }) => [
              { flexDirection: "row", alignItems: "center", gap: 2 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={{ fontSize: 12, color: palette.inkMuted }}>
              Tümünü Gör
            </Text>
            <Ionicons name="chevron-forward" size={14} color={palette.inkMuted} />
          </Pressable>
        </View>
        <View style={{ gap: 8 }}>
          {categoryRows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: "row", gap: 8 }}>
              {row.map((cat) => {
                const s = stats[cat.id] ?? emptyStats;
                return (
                  <View key={cat.id} style={{ flex: 1 }}>
                    <CategoryTile
                      category={cat}
                      count={s.count}
                      total={s.total}
                      wide={row.length === 1}
                      onPress={() =>
                        cat.id === "places"
                          ? router.push("/places-map")
                          : router.push({
                              pathname: "/explore",
                              params: { type: cat.id },
                            })
                      }
                    />
                  </View>
                );
              })}
            </View>
          ))}
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
              const hasPhoto = !!entry.imageUrl;
              return (
                <View
                  key={`${entry.type}-${entry.id}-${i}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 14,
                    backgroundColor: palette.surface,
                    shadowColor: palette.shadow,
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 1,
                  }}
                >
                  <View style={{ width: 44, height: 44 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        overflow: "hidden",
                        backgroundColor: cat?.bg ?? palette.creamDeep,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {hasPhoto ? (
                        <Image
                          source={{ uri: entry.imageUrl! }}
                          style={{ width: 44, height: 44 }}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : entry.type === "places" ? (
                        <CountryFlag id={entry.id} iso2={entry.iso2} size={20} />
                      ) : (
                        <Ionicons
                          name={cat?.icon ?? "checkmark"}
                          size={18}
                          color={cat?.fg ?? palette.brand}
                        />
                      )}
                    </View>
                    {hasPhoto && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: cat?.bg ?? palette.creamDeep,
                          borderWidth: 1.5,
                          borderColor: palette.surface,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name={cat?.icon ?? "checkmark"}
                          size={9}
                          color={cat?.fg ?? palette.brand}
                        />
                      </View>
                    )}
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
