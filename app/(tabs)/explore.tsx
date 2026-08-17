import { HeritageThumbnail } from "@/components/heritage-thumbnail";
import { ProgressCard } from "@/components/progress-card";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { CONTINENTS, ContinentId } from "@/data/continents";
import type { CuisineItem } from "@/data/cuisineApi";
import { getContinentsForCountryField } from "@/data/heritageContinents";
import type { HeritageItem } from "@/data/heritageSites";
import { useCuisineExplorer } from "@/hooks/use-cuisine-explorer";
import { useHeritageExplorer } from "@/hooks/use-heritage-explorer";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";

type Item = HeritageItem | CuisineItem;

const EMPTY: Item[] = [];

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
  const categoryMeta = getCategory(category);

  const heritage = useHeritageExplorer(isHeritage);
  const cuisine = useCuisineExplorer(isCuisine);

  const data: Item[] = isHeritage ? heritage.data : isCuisine ? cuisine.data : EMPTY;
  const loading = isCuisine ? cuisine.loading : false;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "visited" | "unvisited">("all");
  const [expandedContinents, setExpandedContinents] = useState<Set<ContinentId>>(
    new Set(),
  );

  const toggleContinent = (id: ContinentId) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const itemContinents = useMemo(() => {
    const map = new Map<string, ContinentId[]>();
    if (!isHeritage) return map;
    for (const item of heritage.data) {
      map.set(item.id, getContinentsForCountryField(item.country));
    }
    return map;
  }, [isHeritage, heritage.data]);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((item) => {
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCountry =
          "country" in item && item.country.toLowerCase().includes(query);
        if (!matchesName && !matchesCountry) return false;
      }

      if (isHeritage && filter !== "all") {
        const isVisited = heritage.visited.includes(item.id);
        if (filter === "visited" && !isVisited) return false;
        if (filter === "unvisited" && isVisited) return false;
      }

      return true;
    });
  }, [data, search, filter, isHeritage, heritage.visited]);

  const showContinentGroups = isHeritage && search.trim().length === 0;

  const heritageSections = useMemo(() => {
    if (!showContinentGroups) return [];

    return CONTINENTS.map((continent) => {
      const items = (filteredData as HeritageItem[]).filter((item) =>
        itemContinents.get(item.id)?.includes(continent.id),
      );
      const visitedCount = items.filter((item) =>
        heritage.visited.includes(item.id),
      ).length;

      return {
        continent,
        total: items.length,
        visitedCount,
        data: expandedContinents.has(continent.id) ? items : [],
      };
    }).filter((section) => section.total > 0);
  }, [
    showContinentGroups,
    filteredData,
    itemContinents,
    expandedContinents,
    heritage.visited,
  ]);

  const renderExploreItem = ({ item }: { item: Item }) => {
    const isVisited = isHeritage && heritage.visited.includes(item.id);

    return (
      <Pressable
        onPress={() => {
          if (isCuisine) {
            router.push(`/cuisine/${encodeURIComponent(item.id)}`);
            return;
          }
          router.push(`/heritage/${encodeURIComponent(item.id)}`);
        }}
        style={({ pressed }) => [
          {
            backgroundColor: palette.surface,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: palette.hairline,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <View>
          {isHeritage ? (
            <HeritageThumbnail item={item as HeritageItem} />
          ) : (
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 18,
                backgroundColor: palette.creamDeep,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="restaurant-outline"
                size={24}
                color={palette.violet}
              />
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: palette.ink,
              lineHeight: 22,
            }}
          >
            {item.name}
          </Text>

          {"country" in item && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 6,
                gap: 4,
              }}
            >
              <Ionicons
                name="location-outline"
                size={13}
                color={palette.inkMuted}
              />
              <Text style={{ fontSize: 13, color: palette.inkMuted }}>
                {item.country}
              </Text>
            </View>
          )}

          {"category" in item && item.category && (
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: 8,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: palette.violetSoft,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: palette.violet,
                  letterSpacing: 0.5,
                }}
              >
                {item.category.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {isCuisine && (
          <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
        )}

        {isHeritage && (
          <Pressable
            onPress={() => heritage.toggle(item.id)}
            hitSlop={8}
            style={({ pressed }) => [
              {
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isVisited
                  ? (categoryMeta?.fg ?? palette.brand)
                  : palette.cream,
                borderWidth: isVisited ? 0 : 1,
                borderColor: palette.hairline,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons
              name={isVisited ? "checkmark" : "ellipse-outline"}
              size={17}
              color={isVisited ? palette.surface : palette.inkFaint}
            />
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={categoryTitle}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      {loading && (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={palette.brand} />
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
              detail={`${heritage.visited.length} of ${heritage.heritageTotal} visited`}
              percent={heritage.percent}
              accentBg={categoryMeta?.bg}
              accentFg={categoryMeta?.fg}
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
            <Ionicons
              name="search-outline"
              size={18}
              color={palette.inkFaint}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search..."
              placeholderTextColor={palette.inkFaint}
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 15,
                color: palette.ink,
              }}
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

          {isHeritage && (
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginHorizontal: 16,
                marginTop: 12,
              }}
            >
              {(
                [
                  { id: "all", label: "All" },
                  { id: "visited", label: "Visited" },
                  { id: "unvisited", label: "Not visited" },
                ] as const
              ).map((chip) => {
                const active = filter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => setFilter(chip.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: active
                        ? (categoryMeta?.fg ?? palette.brand)
                        : palette.surface,
                      borderWidth: active ? 0 : 1,
                      borderColor: palette.hairline,
                      marginBottom: 8,
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
          )}

          {showContinentGroups ? (
            <SectionList
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
              sections={heritageSections}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    marginTop: 40,
                    color: palette.inkMuted,
                  }}
                >
                  {filter === "visited"
                    ? "No visited sites yet"
                    : "No results"}
                </Text>
              }
              renderSectionHeader={({ section }) => {
                const expanded = expandedContinents.has(section.continent.id);
                return (
                  <Pressable
                    onPress={() => toggleContinent(section.continent.id)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginHorizontal: 16,
                        marginTop: 12,
                        paddingVertical: 13,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        backgroundColor: palette.surface,
                        borderWidth: 1,
                        borderColor: palette.hairline,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={{ fontSize: 14, fontWeight: "700", color: palette.ink }}
                    >
                      {section.continent.nameEn}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={{ fontSize: 12, color: palette.inkMuted }}>
                        {section.visitedCount}/{section.total}
                      </Text>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={palette.inkMuted}
                      />
                    </View>
                  </Pressable>
                );
              }}
              renderItem={renderExploreItem}
            />
          ) : (
            <FlatList
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
              data={filteredData}
              keyExtractor={(item) => item.id}
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
              renderItem={renderExploreItem}
            />
          )}
        </>
      )}
    </View>
  );
}
