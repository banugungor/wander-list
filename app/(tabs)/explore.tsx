import { palette } from "@/constants/palette";
import { ProgressCard } from "@/components/progress-card";
import { VisitedBadge } from "@/components/visited-badge";
import {
  CUISINE_AREA_TOTALS_KEY,
  HERITAGE_DATA_CACHE_KEY,
  HERITAGE_TOTAL_COUNT_KEY,
  HERITAGE_VISITED_KEY,
} from "@/data/heritageStorage";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

const LIMIT = 50;

type HeritageItem = {
  id: string;
  name: string;
  country: string;
};

type CuisineItem = {
  id: string;
  name: string;
};

type Item = HeritageItem | CuisineItem;

export default function ExploreScreen() {
  const { type } = useLocalSearchParams();
  const categoryParam = Array.isArray(type) ? type[0] : type;
  const category =
    typeof categoryParam === "string" ? categoryParam : "heritage";

  const isHeritage = category === "heritage";
  const isCuisine = category === "cuisine";
  const isComingSoon = !isHeritage && !isCuisine;

  const categoryTitleMap: Record<string, string> = {
    heritage: "World Heritage",
    cuisine: "World Cuisines",
    places: "Places Visited",
    books: "Books",
    movies: "Movies",
  };
  const categoryTitle = categoryTitleMap[category] ?? "Details";

  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  const visited = useAppStore((s) => s.visitedHeritage);
  const setVisited = useAppStore((s) => s.setVisitedHeritage);

  const persistTotalCount = useCallback((rawCount: unknown) => {
    const parsedCount =
      typeof rawCount === "number"
        ? rawCount
        : typeof rawCount === "string"
          ? Number(rawCount)
          : NaN;

    if (Number.isFinite(parsedCount) && parsedCount > 0) {
      const safeCount = Math.floor(parsedCount);
      setTotalCount(safeCount);
      AsyncStorage.setItem(HERITAGE_TOTAL_COUNT_KEY, JSON.stringify(safeCount));
      return true;
    }

    return false;
  }, []);

  const fetchHeritageTotalCount = useCallback(async () => {
    try {
      const res = await fetch(
        "https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records?limit=1&offset=0",
      );
      const json = await res.json();
      persistTotalCount(json.total_count);
    } catch (e) {
      console.log("HERITAGE TOTAL COUNT ERROR", e);
    }
  }, [persistTotalCount]);

  // =========================
  // 🌍 HERITAGE FETCH
  // =========================
  const fetchHeritagePage = useCallback(
    async (pageOffset: number) => {
      try {
        setLoadingMore(true);

        const res = await fetch(
          `https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records?limit=${LIMIT}&offset=${pageOffset}`,
        );

        const json = await res.json();
        persistTotalCount(json.total_count);

        const parsed: HeritageItem[] = (json.results ?? [])
          .map((r: any, index: number) => ({
            id: String(r.uuid ?? `fallback-${pageOffset + index}`),
            name: r.name_en ?? r.name_fr ?? "Unknown site",
            country: Array.isArray(r.states_names)
              ? r.states_names.join(", ")
              : (r.states_names ?? "Unknown country"),
          }))
          .filter((x: HeritageItem) => x.name.trim().length > 0);

        setData((prev) => {
          const merged = [...prev, ...parsed];
          AsyncStorage.setItem(HERITAGE_DATA_CACHE_KEY, JSON.stringify(merged));
          return merged;
        });

        if (parsed.length < LIMIT) setHasMore(false);

        setLoading(false);
        setLoadingMore(false);
      } catch (e) {
        console.log("HERITAGE ERROR", e);
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [persistTotalCount],
  );

  // =========================
  // 🍜 CUISINE FETCH
  // =========================
  const fetchCuisineList = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "https://www.themealdb.com/api/json/v1/1/list.php?a=list",
      );
      const json = await res.json();

      const cuisines: CuisineItem[] = (json.meals ?? []).map((c: any) => ({
        id: c.strArea,
        name: c.strArea,
      }));

      setData(cuisines);
      setLoading(false);

      // Tüm alanların yemek sayılarını arka planda çek (bir kez)
      const existingRaw = await AsyncStorage.getItem(CUISINE_AREA_TOTALS_KEY);
      const existingTotals = existingRaw ? JSON.parse(existingRaw) : {};
      const missing = cuisines.filter(
        (c) => existingTotals[c.name] === undefined,
      );

      if (missing.length > 0) {
        const fetched: Record<string, number> = {};
        await Promise.all(
          missing.map(async (c) => {
            try {
              const r = await fetch(
                `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(c.id)}`,
              );
              const j = await r.json();
              fetched[c.name] = (j.meals ?? []).length;
            } catch {}
          }),
        );
        const merged = { ...existingTotals, ...fetched };
        await AsyncStorage.setItem(
          CUISINE_AREA_TOTALS_KEY,
          JSON.stringify(merged),
        );
      }
    } catch (e) {
      console.log("CUISINE ERROR", e);
      setLoading(false);
    }
  }, []);

  // =========================
  // 🔥 INITIAL LOAD
  // =========================
  useEffect(() => {
    const init = async () => {
      if (isCuisine) {
        fetchCuisineList();
        return;
      }

      if (isHeritage) {
        const [cached, cachedTotalCount] = await Promise.all([
          AsyncStorage.getItem(HERITAGE_DATA_CACHE_KEY),
          AsyncStorage.getItem(HERITAGE_TOTAL_COUNT_KEY),
        ]);

        if (cachedTotalCount) {
          const parsedCount = JSON.parse(cachedTotalCount);
          persistTotalCount(parsedCount);
        }

        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setData(parsed);
            setLoading(false);
            setOffset(parsed.length);
            if (!cachedTotalCount) {
              fetchHeritageTotalCount();
            }
            return;
          }
        }
        fetchHeritagePage(0);
        return;
      }

      setLoading(false);
    };

    init();
  }, [
    category,
    fetchCuisineList,
    fetchHeritagePage,
    fetchHeritageTotalCount,
    isCuisine,
    isHeritage,
    persistTotalCount,
  ]);

  // =========================
  // 🔥 LOAD VISITED
  // =========================
  useEffect(() => {
    AsyncStorage.getItem(HERITAGE_VISITED_KEY).then((data) => {
      if (data) setVisited(JSON.parse(data));
    });
  }, [setVisited]);

  // =========================
  // 🔥 LOAD MORE (only heritage)
  // =========================
  const loadMore = () => {
    if (!isHeritage) return;

    if (!loadingMore && hasMore) {
      const next = offset + LIMIT;
      setOffset(next);
      fetchHeritagePage(next);
    }
  };

  const toggle = async (id: string) => {
    if (!isHeritage) return;

    let updated;
    if (visited.includes(id)) {
      updated = visited.filter((v) => v !== id);
    } else {
      updated = [...visited, id];
    }

    setVisited(updated);
    await AsyncStorage.setItem(HERITAGE_VISITED_KEY, JSON.stringify(updated));
  };

  const heritageTotal = totalCount || data.length;
  const rawPercent =
    isHeritage && heritageTotal > 0
      ? Math.round((visited.length / heritageTotal) * 100)
      : 0;
  const percent = Math.min(100, Math.max(0, rawPercent));

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: palette.cream,
        }}
      >
        <ActivityIndicator size="large" color={palette.coral} />
        <Text style={{ marginTop: 12, color: palette.inkMuted }}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen
        options={{
          title: categoryTitle,
          headerBackTitle: "Back",
        }}
      />

      {isComingSoon && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800", color: palette.ink }}>
            Coming Soon
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 15,
              color: palette.inkMuted,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {categoryTitle} section will be available in a future update.
          </Text>
        </View>
      )}

      {!isComingSoon && (
        <>
          {isHeritage && (
            <ProgressCard
              label="Progress"
              detail={`${visited.length} of ${heritageTotal} visited`}
              percent={percent}
              icon="flag-outline"
            />
          )}

          <FlatList
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            data={data}
            keyExtractor={(item) => item.id}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  style={{ marginTop: 20 }}
                  color={palette.coral}
                />
              ) : null
            }
            renderItem={({ item }) => {
              const isVisited = isHeritage && visited.includes(item.id);

              return (
                <Pressable
                  onPress={() => {
                    if (isCuisine) {
                      router.push(`/cuisine/${encodeURIComponent(item.id)}`);
                      return;
                    }
                    toggle(item.id); // heritage
                  }}
                  style={({ pressed }) => [
                    {
                      backgroundColor: palette.surface,
                      borderRadius: 18,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: palette.hairline,
                      shadowColor: palette.shadow,
                      shadowOpacity: 0.06,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 2,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: palette.creamDeep,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={isCuisine ? "restaurant-outline" : "business-outline"}
                      size={18}
                      color={palette.violet}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: palette.ink,
                        marginBottom: 4,
                      }}
                    >
                      {item.name}
                    </Text>

                    {"country" in item && (
                      <Text style={{ fontSize: 13, color: palette.inkMuted }}>
                        {item.country}
                      </Text>
                    )}
                  </View>

                  {isHeritage && <VisitedBadge checked={isVisited} />}

                  {isCuisine && (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={palette.inkFaint}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </>
      )}
    </View>
  );
}
