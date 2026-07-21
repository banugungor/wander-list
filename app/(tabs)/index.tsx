import { palette } from "@/constants/palette";
import {
  CUISINE_AREA_TOTALS_KEY,
  CUISINE_VISITED_KEY,
  HERITAGE_DATA_CACHE_KEY,
  HERITAGE_TOTAL_COUNT_KEY,
  HERITAGE_VISITED_KEY,
} from "@/data/heritageStorage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

const categories = [
  { id: "heritage", title: "World Heritage", icon: "business-outline" },
  { id: "places", title: "Places Visited", icon: "location-outline" },
  { id: "cuisine", title: "World Cuisines", icon: "restaurant-outline" },
  { id: "books", title: "Books", icon: "book-outline" },
  { id: "movies", title: "Movies", icon: "film-outline" },
] as const;

function CategoryCard({ cat, progress }: any) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/explore",
          params: { type: cat.id },
        })
      }
      style={({ pressed }) => [
        {
          width: "47%",
          backgroundColor: palette.surface,
          padding: 18,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: palette.hairline,
          shadowColor: palette.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
        },
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.95 },
      ]}
    >
      <LinearGradient
        colors={[palette.coral, palette.violet]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <Ionicons name={cat.icon} size={20} color={palette.surface} />
      </LinearGradient>

      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: palette.ink,
          letterSpacing: 0.1,
        }}
      >
        {cat.title}
      </Text>

      {/* Progress */}
      <View style={{ marginTop: 14 }}>
        <View
          style={{
            height: 5,
            backgroundColor: palette.creamDeep,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={[palette.coral, palette.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: `${progress}%`,
              height: 5,
              borderRadius: 6,
            }}
          />
        </View>

        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            fontWeight: "600",
            color: palette.coral,
            letterSpacing: 0.2,
          }}
        >
          {progress}% completed
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [progressMap, setProgressMap] = useState<any>({});

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          // heritage visited
          const visitedData = await AsyncStorage.getItem(HERITAGE_VISITED_KEY);
          const visited = visitedData ? JSON.parse(visitedData) : [];

          // heritage total count
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
          const rawHeritagePercent =
            heritageTotal > 0
              ? Math.round((visited.length / heritageTotal) * 100)
              : 0;
          const heritagePercent = Math.min(
            100,
            Math.max(0, rawHeritagePercent),
          );

          // cuisine progress
          const [visitedMealsData, areaTotalsData] = await Promise.all([
            AsyncStorage.getItem(CUISINE_VISITED_KEY),
            AsyncStorage.getItem(CUISINE_AREA_TOTALS_KEY),
          ]);
          const visitedMeals = visitedMealsData
            ? JSON.parse(visitedMealsData)
            : [];
          const areaTotals = areaTotalsData ? JSON.parse(areaTotalsData) : {};
          const totalMeals = Object.values(areaTotals).reduce(
            (sum: number, c: any) => sum + c,
            0,
          );
          const cuisinePercent =
            totalMeals > 0
              ? Math.min(
                  100,
                  Math.round((visitedMeals.length / totalMeals) * 100),
                )
              : 0;

          setProgressMap({
            heritage: heritagePercent,
            places: 0,
            cuisine: cuisinePercent,
            books: 0,
            movies: 0,
          });
        } catch (e) {
          console.log("home load error", e);
        }
      };

      load();
    }, []),
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      {/* AMBIENT GLOW */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -70,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: 120,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={["rgba(255,94,122,0.32)", "rgba(124,58,237,0)"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 160,
          left: -80,
          width: 200,
          height: 200,
          borderRadius: 100,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={["rgba(124,58,237,0.18)", "rgba(124,58,237,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>

      {/* HEADER */}
      <View style={{ paddingHorizontal: 20, paddingTop: 64 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: palette.violet,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Your Journey
        </Text>

        <Text
          style={{
            marginTop: 6,
            fontSize: 32,
            fontWeight: "800",
            color: palette.ink,
            letterSpacing: -0.5,
          }}
        >
          Life Experience Map
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: palette.inkMuted,
          }}
        >
          Track the experiences that shape your life
        </Text>
      </View>

      {/* CARDS */}
      <View
        style={{
          marginTop: 28,
          paddingHorizontal: 16,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            progress={progressMap[cat.id] ?? 0}
          />
        ))}
      </View>
    </View>
  );
}
