import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

const STORAGE_KEY = "visited_heritage";
const CACHE_VERSION = "v1";
const DATA_CACHE_KEY = `heritage_cache_${CACHE_VERSION}`;

const categories = [
  { id: "heritage", title: "World Heritage", emoji: "🏛" },
  { id: "places", title: "Places Visited", emoji: "🌍" },
  { id: "cuisine", title: "World Cuisines", emoji: "🍜" },
  { id: "books", title: "Books", emoji: "📚" },
  { id: "movies", title: "Movies", emoji: "🎬" },
];

function CategoryCard({ cat, progress }: any) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/explore",
          params: { type: cat.id },
        })
      }
      style={{
        width: "48%",
        backgroundColor: "#fff",
        padding: 18,
        borderRadius: 20,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 26, marginBottom: 10 }}>{cat.emoji}</Text>

      <Text style={{ fontSize: 15, fontWeight: "600", color: "#111" }}>
        {cat.title}
      </Text>

      {/* Progress */}
      <View style={{ marginTop: 12 }}>
        <View
          style={{
            height: 6,
            backgroundColor: "#eee",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress}%`,
              height: 6,
              backgroundColor: "#111",
            }}
          />
        </View>

        <Text style={{ marginTop: 6, fontSize: 12, color: "#777" }}>
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
          const visitedData = await AsyncStorage.getItem(STORAGE_KEY);
          const visited = visitedData ? JSON.parse(visitedData) : [];

          // heritage total
          const cachedData = await AsyncStorage.getItem(DATA_CACHE_KEY);
          const cached = cachedData ? JSON.parse(cachedData) : [];

          const heritageTotal = cached.length || 1;
          const heritagePercent = Math.round(
            (visited.length / heritageTotal) * 100,
          );

          // diğer kategoriler şimdilik 0
          setProgressMap({
            heritage: heritagePercent,
            places: 0,
            cuisine: 0,
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
    <LinearGradient colors={["#F5F7FA", "#ECEFF3"]} style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#111" }}>
          Life Experience Map
        </Text>

        <Text style={{ marginTop: 6, fontSize: 14, color: "#777" }}>
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
          justifyContent: "space-between",
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
    </LinearGradient>
  );
}
