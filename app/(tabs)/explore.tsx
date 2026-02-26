import { useAppStore } from "@/store/useAppStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

const STORAGE_KEY = "visited_heritage";

const CACHE_VERSION = "v1";
const DATA_CACHE_KEY = `heritage_cache_${CACHE_VERSION}`;

type HeritageItem = {
  id: string;
  name: string;
  country: string;
};

const sanitizeKeyPart = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const buildStableId = (item: any, index: number) => {
  const rawId = item?.id ?? item?.recordid;
  const idAsString = rawId != null ? String(rawId).trim() : "";

  if (idAsString && idAsString !== "undefined" && idAsString !== "null") {
    return idAsString;
  }

  const rawName = item?.name ?? item?.fields?.name_en ?? "unknown-site";
  const rawCountry =
    item?.country ?? item?.fields?.states_name_en ?? "unknown-country";

  return `fallback-${index}-${sanitizeKeyPart(String(rawName))}-${sanitizeKeyPart(String(rawCountry))}`;
};

const normalizeHeritageData = (items: any[]): HeritageItem[] => {
  const seen = new Set<string>();
  const normalized: HeritageItem[] = [];

  items.forEach((item, index) => {
    const id = buildStableId(item, index);
    if (seen.has(id)) return;

    seen.add(id);
    normalized.push({
      id,
      name: item?.name ?? item?.fields?.name_en ?? "Unknown site",
      country:
        item?.country ?? item?.fields?.states_name_en ?? "Unknown country",
    });
  });

  return normalized;
};

export default function ExploreScreen() {
  const { type } = useLocalSearchParams();
  const categoryParam = Array.isArray(type) ? type[0] : type;
  const category = typeof categoryParam === "string" ? categoryParam : "heritage";
  const isHeritageCategory = category === "heritage";

  const [data, setData] = useState<HeritageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const visited = useAppStore((s) => s.visitedHeritage);
  const setVisited = useAppStore((s) => s.setVisitedHeritage);

  // 🔥 veri yükleme (cache varsa API çağrılmaz)
  useEffect(() => {
    const fetchHeritage = async () => {
      try {
        // önce cache kontrol
        const cached = await AsyncStorage.getItem(DATA_CACHE_KEY);

        if (cached) {
          const parsed = JSON.parse(cached);

          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log("Loaded from cache");
            setData(parsed);
            setLoading(false);
            return;
          }

          console.log("Cache empty → refetching");
        }

        console.log("Fetching ALL heritage from API");

        const limit = 100;

        // toplam kayıt sayısını öğren
        const first = await fetch(
          "https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records?limit=1",
        );
        const firstJson = await first.json();

        const total = firstJson.total_count;

        let all: HeritageItem[] = [];

        // pagination ile hepsini çek
        for (let offset = 0; offset < total; offset += limit) {
          console.log("fetching offset", offset);

          const res = await fetch(
            `https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records?limit=${limit}&offset=${offset}`,
          );

          const json = await res.json();
          console.log("json", json);
          const parsed = (json.results ?? [])
            .map((r: any, index: number) => ({
              id: String(r.uuid ?? `fallback-${offset + index}`),
              name: r.name_en ?? r.name_fr,
              country: Array.isArray(r.states_names)
                ? r.states_names.join(", ")
                : r.states_names,
            }))
            .filter((x: any) => x.name && x.name.trim().length > 0);
          console.log("parsed", parsed);
          all = [...all, ...parsed];
        }

        const uniqueAll = normalizeHeritageData(all);

        console.log("TOTAL FETCHED:", uniqueAll.length);

        setData(uniqueAll);

        // cache'e yaz
        await AsyncStorage.setItem(DATA_CACHE_KEY, JSON.stringify(uniqueAll));

        setLoading(false);
      } catch (e) {
        console.log("FETCH ERROR", e);
        setLoading(false);
      }
    };

    if (isHeritageCategory) {
      fetchHeritage();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [isHeritageCategory]);

  

  // 🔥 visited yükle
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) setVisited(JSON.parse(data));
    });
  }, [setVisited]);

  const toggle = async (id: string) => {
    let updated;

    if (visited.includes(id)) {
      updated = visited.filter((v) => v !== id);
    } else {
      updated = [...visited, id];
    }

    setVisited(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const percent =
    data.length > 0 ? Math.round((visited.length / data.length) * 100) : 0;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading heritage sites…</Text>
      </View>
    );
  }

  if (!isHeritageCategory) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#111" }}>
          Coming soon
        </Text>
        <Text style={{ marginTop: 10, fontSize: 14, color: "#777" }}>
          This category has no data yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F7" }}>
      <View style={{ paddingLeft: 20, paddingTop: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          Progress: {percent}%
        </Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isVisited = visited.includes(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 18,
                marginBottom: 14,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: 1,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#111",
                    marginBottom: 4,
                  }}
                >
                  {item.name}
                </Text>

                <Text style={{ fontSize: 14, color: "#888" }}>
                  {item.country}
                </Text>
              </View>

              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  borderWidth: 1.5,
                  borderColor: isVisited ? "#111" : "#DDD",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isVisited ? "#111" : "transparent",
                }}
              >
                {isVisited && (
                  <Text style={{ color: "#fff", fontSize: 14 }}>✓</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
