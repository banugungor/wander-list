import { CircularProgress } from "@/components/circular-progress";
import { CountryFlag } from "@/components/country-flag";
import { ScreenHeader } from "@/components/screen-header";
import { palette } from "@/constants/palette";
import { logActivity } from "@/data/activityLog";
import { queueCloudSync } from "@/data/cloudSync";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import worldData from "@/data/worldCountries.json";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

type CountryPath = { id: string; name: string; d: string; iso2?: string };

const { width: screenWidth } = Dimensions.get("window");
const mapWidth = screenWidth - 32;
const mapHeight = mapWidth * (worldData.height / worldData.width);
const MAX_SCALE = 5;

export default function PlacesMapScreen() {
  const [visited, setVisited] = useState<string[]>([]);
  const [zoomed, setZoomed] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerFilter, setPickerFilter] = useState<"all" | "visited">("all");
  const [listFilter, setListFilter] = useState<"all" | "visited">("visited");
  const countries = worldData.countries as CountryPath[];

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetZoom = useCallback(() => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setZoomed(false);
  }, [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = Math.min(MAX_SCALE, Math.max(1, savedScale.value * e.scale));
      scale.value = next;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.02) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(setZoomed)(false);
      } else {
        runOnJS(setZoomed)(true);
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .minDistance(10)
    .enabled(zoomed)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PLACES_VISITED_KEY).then((raw) => {
        setVisited(raw ? JSON.parse(raw) : []);
      });
    }, []),
  );

  const toggle = async (country: CountryPath) => {
    const wasVisited = visited.includes(country.id);
    const updated = wasVisited
      ? visited.filter((id) => id !== country.id)
      : [...visited, country.id];

    setVisited(updated);
    await AsyncStorage.setItem(PLACES_VISITED_KEY, JSON.stringify(updated));
    queueCloudSync();

    if (!wasVisited) {
      logActivity({
        id: country.id,
        type: "places",
        title: country.name,
        iso2: country.iso2,
      });
    }
  };

  const visitedCountries = useMemo(
    () =>
      countries
        .filter((c) => visited.includes(c.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [countries, visited],
  );

  const allSorted = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries],
  );

  const displayedCountries =
    listFilter === "all" ? allSorted : visitedCountries;

  const pickerResults = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase();
    return allSorted.filter((c) => {
      if (pickerFilter === "visited" && !visited.includes(c.id)) return false;
      if (query && !c.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [allSorted, pickerSearch, pickerFilter, visited]);

  const percent =
    countries.length > 0
      ? Math.round((visited.length / countries.length) * 100)
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <ScreenHeader
          title="Gittiğin Ülkeler"
          subtitle="Dünyayı keşfetmeye devam et"
        />

        {/* STATS ROW */}
        <View
          style={{
            marginTop: 16,
            marginHorizontal: 16,
            backgroundColor: palette.surface,
            borderRadius: 18,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: palette.shadow,
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 1,
          }}
        >
          <View
            style={{
              backgroundColor: palette.greenSoft,
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "700", color: palette.greenText }}>
              {visited.length}
            </Text>
            <Text style={{ fontSize: 11, color: palette.greenText }}>Ülke</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 13, color: palette.inkMuted }}>
              <Text style={{ fontWeight: "700", color: palette.ink }}>
                /{countries.length}
              </Text>{" "}
              ülke keşfedildi
            </Text>
          </View>

          <CircularProgress percent={percent} size={52} strokeWidth={6} />
        </View>

        {/* MAP */}
        <View
          style={{
            marginTop: 16,
            marginHorizontal: 16,
            backgroundColor: palette.surface,
            borderRadius: 16,
            padding: 8,
            overflow: "hidden",
            shadowColor: palette.shadow,
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 1,
          }}
        >
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[{ width: mapWidth, height: mapHeight }, animatedStyle]}
            >
              <Svg
                width={mapWidth}
                height={mapHeight}
                viewBox={`0 0 ${worldData.width} ${worldData.height}`}
              >
                {countries.map((country) => {
                  const isVisited = visited.includes(country.id);
                  return (
                    <Path
                      key={country.id}
                      d={country.d}
                      fill={isVisited ? palette.brand : palette.creamDeep}
                      stroke={palette.surface}
                      strokeWidth={0.5}
                      onPress={() => toggle(country)}
                    />
                  );
                })}
              </Svg>
            </Animated.View>
          </GestureDetector>

          {zoomed && (
            <Pressable
              onPress={resetZoom}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: palette.surface,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: palette.shadow,
                shadowOpacity: 0.15,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <Ionicons name="contract-outline" size={16} color={palette.ink} />
            </Pressable>
          )}
        </View>

        <View style={{ alignItems: "center", marginTop: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: palette.greenSoft,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="hand-left-outline" size={14} color={palette.greenText} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: palette.greenText }}>
              Ülke seçerek işaretle
            </Text>
          </View>
        </View>

        {/* VISITED LIST */}
        <View
          style={{
            marginTop: 24,
            marginBottom: 12,
            marginHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(
              [
                { id: "all", label: "Tümü" },
                { id: "visited", label: "Ziyaret ettiklerin" },
              ] as const
            ).map((chip) => {
              const active = listFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setListFilter(chip.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: active ? palette.brand : palette.surface,
                    borderWidth: active ? 0 : 1,
                    borderColor: palette.hairline,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: active ? palette.surface : palette.inkMuted,
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: palette.creamDeep,
              borderRadius: 10,
              padding: 3,
              gap: 2,
            }}
          >
            <Pressable
              onPress={() => setViewMode("grid")}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor:
                  viewMode === "grid" ? palette.surface : "transparent",
              }}
            >
              <Ionicons name="grid-outline" size={15} color={palette.ink} />
            </Pressable>
            <Pressable
              onPress={() => setViewMode("list")}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor:
                  viewMode === "list" ? palette.surface : "transparent",
              }}
            >
              <Ionicons name="list-outline" size={15} color={palette.ink} />
            </Pressable>
          </View>
        </View>

        {displayedCountries.length === 0 ? (
          <Text
            style={{
              marginHorizontal: 16,
              fontSize: 13,
              color: palette.inkMuted,
            }}
          >
            Henüz işaretlediğin ülke yok
          </Text>
        ) : (
          <View
            style={{
              marginHorizontal: 16,
              flexDirection: viewMode === "grid" ? "row" : "column",
              flexWrap: viewMode === "grid" ? "wrap" : "nowrap",
              gap: 10,
            }}
          >
            {displayedCountries.map((c) => {
              const isVisited = visited.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggle(c)}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      backgroundColor: palette.surface,
                      borderRadius: 14,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      width: viewMode === "grid" ? "31%" : "100%",
                      shadowColor: palette.shadow,
                      shadowOpacity: 0.04,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 1,
                    },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <CountryFlag id={c.id} iso2={c.iso2} size={18} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: "600",
                      color: palette.ink,
                    }}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                  <Ionicons
                    name={isVisited ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={isVisited ? palette.brand : palette.inkFaint}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* CTA */}
        <Pressable
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [
            {
              marginTop: 24,
              marginHorizontal: 16,
              backgroundColor: palette.brand,
              borderRadius: 999,
              paddingVertical: 15,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>
            Yeni Ülke İşaretle
          </Text>
          <Ionicons name="add" size={18} color={palette.surface} />
        </Pressable>
      </ScrollView>

      {/* PICKER MODAL */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: palette.cream, paddingTop: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: palette.ink }}>
              Ülke seç
            </Text>
            <Pressable onPress={() => setPickerVisible(false)}>
              <Ionicons name="close" size={22} color={palette.inkMuted} />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 16,
              marginBottom: 12,
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
              value={pickerSearch}
              onChangeText={setPickerSearch}
              placeholder="Ülke ara..."
              placeholderTextColor={palette.inkFaint}
              style={{ flex: 1, marginLeft: 8, fontSize: 15, color: palette.ink }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginHorizontal: 16,
              marginBottom: 12,
            }}
          >
            {(
              [
                { id: "all", label: "Tümü" },
                { id: "visited", label: "Ziyaret ettiklerin" },
              ] as const
            ).map((chip) => {
              const active = pickerFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setPickerFilter(chip.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: active ? palette.brand : palette.surface,
                    borderWidth: active ? 0 : 1,
                    borderColor: palette.hairline,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: active ? palette.surface : palette.inkMuted,
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FlatList
            data={pickerResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            ListEmptyComponent={
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 40,
                  fontSize: 13,
                  color: palette.inkMuted,
                }}
              >
                {pickerFilter === "visited"
                  ? "Henüz işaretlediğin ülke yok"
                  : "Sonuç bulunamadı"}
              </Text>
            }
            renderItem={({ item }) => {
              const isVisited = visited.includes(item.id);
              return (
                <Pressable
                  onPress={() => toggle(item)}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: palette.hairline,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <CountryFlag id={item.id} iso2={item.iso2} size={20} />
                  <Text style={{ flex: 1, fontSize: 15, color: palette.ink }}>
                    {item.name}
                  </Text>
                  <Ionicons
                    name={isVisited ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={isVisited ? palette.brand : palette.inkFaint}
                  />
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
