import { ProgressCard } from "@/components/progress-card";
import { palette } from "@/constants/palette";
import {
  CUISINE_AREA_TOTALS_KEY,
  CUISINE_VISITED_KEY,
} from "@/data/heritageStorage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

type Meal = {
  id: string;
  name: string;
  thumb: string;
};

export default function CuisineMealsScreen() {
  const { area } = useLocalSearchParams();
  const cuisine = Array.isArray(area) ? area[0] : area;
  const cuisineTitle =
    typeof cuisine === "string" && cuisine.length > 0
      ? decodeURIComponent(cuisine)
      : "Cuisine";

  const [data, setData] = useState<Meal[]>([]);
  const [visited, setVisited] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // yemekleri çek
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?a=${cuisine}`,
        );

        const json = await res.json();

        const meals: Meal[] = (json.meals ?? []).map((m: any) => ({
          id: m.idMeal,
          name: m.strMeal,
          thumb: m.strMealThumb,
        }));

        setData(meals);
        setLoading(false);

        // toplam yemek sayısını kaydet (progress hesabı için)
        const existing = await AsyncStorage.getItem(CUISINE_AREA_TOTALS_KEY);
        const totals = existing ? JSON.parse(existing) : {};
        totals[cuisineTitle] = meals.length;
        await AsyncStorage.setItem(
          CUISINE_AREA_TOTALS_KEY,
          JSON.stringify(totals),
        );
      } catch (e) {
        console.log("MEAL ERROR", e);
        setLoading(false);
      }
    };

    fetchMeals();
  }, [cuisine]);

  // visited yükle
  useEffect(() => {
    AsyncStorage.getItem(CUISINE_VISITED_KEY).then((v) => {
      if (v) setVisited(JSON.parse(v));
    });
  }, []);

  const toggle = async (id: string) => {
    const raw = await AsyncStorage.getItem(CUISINE_VISITED_KEY);
    const current: string[] = raw ? JSON.parse(raw) : [];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setVisited(updated);
    await AsyncStorage.setItem(CUISINE_VISITED_KEY, JSON.stringify(updated));
  };

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
        <Text style={{ marginTop: 10, color: palette.inkMuted }}>
          Loading meals…
        </Text>
      </View>
    );
  }

  const triedCount = data.filter((m) => visited.includes(m.id)).length;
  const percent = data.length > 0 ? Math.round((triedCount / data.length) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen
        options={{
          title: `${cuisineTitle} Meals`,
          headerBackTitle: "Back",
        }}
      />

      {data.length > 0 && (
        <ProgressCard
          label="Tasted"
          detail={`${triedCount} of ${data.length} tried`}
          percent={percent}
          icon="restaurant-outline"
        />
      )}

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isVisited = visited.includes(item.id);

          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={({ pressed }) => [
                {
                  backgroundColor: palette.surface,
                  borderRadius: 22,
                  marginBottom: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: palette.hairline,
                  shadowColor: palette.shadow,
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 3,
                },
                pressed && { transform: [{ scale: 0.985 }], opacity: 0.96 },
              ]}
            >
              <View>
                <Image
                  source={{ uri: item.thumb }}
                  style={{ width: "100%", height: 190 }}
                  contentFit="cover"
                  transition={200}
                />

                <LinearGradient
                  colors={["rgba(43,27,61,0)", "rgba(43,27,61,0.85)"]}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 100,
                    justifyContent: "flex-end",
                    padding: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: palette.surface,
                    }}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                </LinearGradient>

                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isVisited
                      ? palette.coral
                      : "rgba(255,255,255,0.85)",
                  }}
                >
                  <Ionicons
                    name={isVisited ? "checkmark" : "ellipse-outline"}
                    size={17}
                    color={isVisited ? palette.surface : palette.inkFaint}
                  />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
