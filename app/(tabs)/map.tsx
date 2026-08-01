import { BottomTabBar } from "@/components/bottom-tab-bar";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import {
  HERITAGE_DATA_CACHE_KEY,
  HERITAGE_VISITED_KEY,
} from "@/data/heritageStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

type HeritagePin = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [pins, setPins] = useState<HeritagePin[]>([]);
  const [visited, setVisited] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [cachedData, visitedData] = await Promise.all([
          AsyncStorage.getItem(HERITAGE_DATA_CACHE_KEY),
          AsyncStorage.getItem(HERITAGE_VISITED_KEY),
        ]);

        const cached = cachedData ? JSON.parse(cachedData) : [];
        const withCoords: HeritagePin[] = cached.filter(
          (item: any) =>
            typeof item.latitude === "number" &&
            typeof item.longitude === "number",
        );

        setPins(withCoords);
        setVisited(visitedData ? JSON.parse(visitedData) : []);
      };

      load();
    }, []),
  );

  const heritage = getCategory("heritage")!;
  const visitedCount = useMemo(
    () => pins.filter((p) => visited.includes(p.id)).length,
    [pins, visited],
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <View
        style={{
          position: "absolute",
          top: 60,
          left: 20,
          right: 20,
          zIndex: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "700", color: palette.ink }}>
          Harita
        </Text>
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: palette.hairline,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: heritage.fg }}>
            {visitedCount}/{pins.length} ziyaret edildi
          </Text>
        </View>
      </View>

      {pins.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: palette.ink,
              textAlign: "center",
            }}
          >
            Henüz konum verisi yok
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 13,
              color: palette.inkMuted,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Dünya Mirası listesini bir kez açıp gezindiğinde konumlar burada
            görünecek.
          </Text>
        </View>
      ) : (
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 20,
            longitude: 10,
            latitudeDelta: 90,
            longitudeDelta: 90,
          }}
        >
          {pins.map((pin) => {
            const isVisited = visited.includes(pin.id);
            return (
              <Marker
                key={pin.id}
                coordinate={{
                  latitude: pin.latitude,
                  longitude: pin.longitude,
                }}
                title={pin.name}
                description={pin.country}
                pinColor={isVisited ? heritage.fg : palette.inkFaint}
              />
            );
          })}
        </MapView>
      )}

      <BottomTabBar />
    </View>
  );
}
