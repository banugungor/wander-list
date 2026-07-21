import { ProgressCard } from "@/components/progress-card";
import { VisitedBadge } from "@/components/visited-badge";
import { palette } from "@/constants/palette";
import { fetchCuisines, type CuisineItem } from "@/data/cuisineApi";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const LIMIT = 50;

type HeritageItem = {
  id: string;
  name: string;
  country: string;
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

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

      const cuisines = await fetchCuisines();

      const seenAreas = new Set<string>();
      const deduped = cuisines.filter((c) => {
        if (!c.id || seenAreas.has(c.id)) return false;
        seenAreas.add(c.id);
        return true;
      });

      setData(deduped);
      setLoading(false);

      // Tüm alanların yemek sayılarını arka planda çek (bir kez)
      const existingRaw = await AsyncStorage.getItem(CUISINE_AREA_TOTALS_KEY);
      let existingTotals: Record<string, number> = {};
      if (existingRaw) {
        try {
          existingTotals = JSON.parse(existingRaw);
        } catch (e) {
          console.log("CUISINE TOTALS PARSE ERROR", e);
        }
      }
      const missing = deduped.filter(
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
          try {
            persistTotalCount(JSON.parse(cachedTotalCount));
          } catch (e) {
            console.log("HERITAGE TOTAL COUNT PARSE ERROR", e);
          }
        }

        if (cached) {
          try {
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
          } catch (e) {
            console.log("HERITAGE CACHE PARSE ERROR", e);
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
      if (!data) return;
      try {
        setVisited(JSON.parse(data));
      } catch (e) {
        console.log("HERITAGE VISITED PARSE ERROR", e);
      }
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

  const heritageTotal = totalCount ?? data.length;
  const rawPercent =
    isHeritage && heritageTotal > 0
      ? Math.round((visited.length / heritageTotal) * 100)
      : 0;
  const percent = Math.min(100, Math.max(0, rawPercent));

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesCountry =
        "country" in item && item.country.toLowerCase().includes(query);
      return matchesName || matchesCountry;
    });
  }, [data, search]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen
        options={{
          title: categoryTitle,
          headerBackTitle: "Back",
        }}
      />

      {loading && (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={palette.coral} />
          <Text style={{ marginTop: 12, color: palette.inkMuted }}>
            Loading…
          </Text>
        </View>
      )}

      {!loading && isComingSoon && (
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

      {!loading && !isComingSoon && (
        <>
          {isHeritage && (
            <ProgressCard
              label="Progress"
              detail={`${visited.length} of ${heritageTotal} visited`}
              percent={percent}
              icon="flag-outline"
            />
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 16,
              marginTop: isHeritage ? 4 : 16,
              paddingHorizontal: 14,
              height: 44,
              borderRadius: 12,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.hairline,
            }}
          >
            <Ionicons name="search-outline" size={18} color={palette.inkFaint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search..."
              placeholderTextColor={palette.inkFaint}
              style={{ flex: 1, marginLeft: 8, fontSize: 15, color: palette.ink }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={palette.inkFaint}
                />
              </Pressable>
            )}
          </View>

          <FlatList
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            data={filteredData}
            keyExtractor={(item) => item.id}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              search.trim().length > 0 ? (
                <Text
                  style={{
                    textAlign: "center",
                    marginTop: 40,
                    color: palette.inkMuted,
                  }}
                >
                  No results match “{search}”
                </Text>
              ) : null
            }
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
