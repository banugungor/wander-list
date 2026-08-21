import { BottomTabBar } from "@/components/bottom-tab-bar";
import { CategoryTile } from "@/components/category-tile";
import { CircularProgress } from "@/components/circular-progress";
import { CountryFlag } from "@/components/country-flag";
import { LanguageSwitch } from "@/components/language-switch";
import { RecentItemCard } from "@/components/recent-item-card";
import { categories, getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { ActivityEntry, getActivityLog, timeAgo } from "@/data/activityLog";
import {
  localizedHighlightSubtitle,
  localizedHighlightTitle,
  type CatalogHighlight,
} from "@/data/catalogHighlights";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { getCachedMealIndex } from "@/data/cuisineMeals";
import { toggleCuisineVisited } from "@/data/cuisineVisited";
import { heritageSites } from "@/data/heritageSites";
import { HERITAGE_VISITED_KEY, toggleHeritageVisited } from "@/data/heritageStorage";
import { PLACES_VISITED_KEY, togglePlaceVisited } from "@/data/placesStorage";
import { CUISINE_VISITED_KEY } from "@/data/storageKeys";
import worldData from "@/data/worldCountries.json";
import { useCatalogHighlights } from "@/hooks/use-catalog-highlights";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type CategoryStats = { count: number; total: number; percent: number };

const emptyStats: CategoryStats = { count: 0, total: 0, percent: 0 };

// The overall-progress card sits on a dark background, so its count values use
// brighter variants of each category's color instead of the flatter `fg` shade
// used on the category tiles below.
const OVERALL_PROGRESS_VALUE_COLORS: Record<string, string> = {
  [palette.greenText]: palette.greenShineText,
  [palette.coralText]: palette.orange,
};

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
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<Record<string, CategoryStats>>({});
  const [recent, setRecent] = useState<ActivityEntry[]>([]);
  const { highlights } = useCatalogHighlights();
  const [placesVisitedIds, setPlacesVisitedIds] = useState<string[]>([]);
  const [cuisineVisitedIds, setCuisineVisitedIds] = useState<string[]>([]);
  const visitedHeritage = useAppStore((s) => s.visitedHeritage);
  const setVisitedHeritage = useAppStore((s) => s.setVisitedHeritage);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const visitedData = await AsyncStorage.getItem(HERITAGE_VISITED_KEY);
          const visited: string[] = visitedData ? JSON.parse(visitedData) : [];
          setVisitedHeritage(visited);

          const heritageTotal = heritageSites.length;
          const heritagePercent =
            heritageTotal > 0
              ? Math.min(100, Math.round((visited.length / heritageTotal) * 100))
              : 0;

          const placesVisitedData = await AsyncStorage.getItem(PLACES_VISITED_KEY);
          const visitedCountries: string[] = placesVisitedData
            ? JSON.parse(placesVisitedData)
            : [];
          setPlacesVisitedIds(visitedCountries);
          const placesTotal = worldData.countries.length;
          const placesPercent =
            placesTotal > 0
              ? Math.min(100, Math.round((visitedCountries.length / placesTotal) * 100))
              : 0;

          const cuisineVisitedData = await AsyncStorage.getItem(CUISINE_VISITED_KEY);
          const visitedMeals: string[] = cuisineVisitedData
            ? JSON.parse(cuisineVisitedData)
            : [];
          setCuisineVisitedIds(visitedMeals);
          const mealIndex = await getCachedMealIndex();
          const cuisineTotal = mealIndex
            ? Object.values(mealIndex.counts).reduce((sum, c) => sum + c, 0)
            : 0;
          const cuisinePercent =
            cuisineTotal > 0
              ? Math.min(100, Math.round((visitedMeals.length / cuisineTotal) * 100))
              : 0;

          setStats({
            heritage: {
              count: visited.length,
              total: heritageTotal,
              percent: heritagePercent,
            },
            places: {
              count: visitedCountries.length,
              total: placesTotal,
              percent: placesPercent,
            },
            cuisine: {
              count: visitedMeals.length,
              total: cuisineTotal,
              percent: cuisinePercent,
            },
          });

          const log = await getActivityLog();
          setRecent(log.slice(0, 3));
        } catch (e) {
          console.log("home load error", e);
        }
      };

      load();
    }, [setVisitedHeritage]),
  );

  // Shared by both home-screen rails below — the viewer's own recent activity
  // and our admin-curated "what's new" highlights both mark visited/tasted
  // through the exact same per-category toggle functions.
  const isTypeIdVisited = (type: string, id: string): boolean => {
    if (type === "heritage") return visitedHeritage.includes(id);
    if (type === "places") return placesVisitedIds.includes(id);
    if (type === "cuisine") return cuisineVisitedIds.includes(id);
    return false;
  };

  // Keeps the overall-progress card and category tiles in sync the instant
  // something is toggled here, instead of only after the next screen focus.
  const updateStatsCount = (type: string, count: number) => {
    setStats((prev) => {
      const current = prev[type];
      if (!current) return prev;
      const percent =
        current.total > 0 ? Math.min(100, Math.round((count / current.total) * 100)) : 0;
      return { ...prev, [type]: { ...current, count, percent } };
    });
  };

  const toggleTypeId = async (
    type: string,
    id: string,
    info: { name: string; subtitle?: string | null; imageUrl?: string | null; iso2?: string | null },
  ) => {
    if (type === "heritage") {
      const updated = await toggleHeritageVisited(
        id,
        { name: info.name, country: info.subtitle ?? "", imageUrl: info.imageUrl },
        visitedHeritage,
      );
      setVisitedHeritage(updated);
      updateStatsCount(type, updated.length);
    } else if (type === "places") {
      const updated = await togglePlaceVisited(
        id,
        { name: info.name, iso2: info.iso2 ?? undefined },
        placesVisitedIds,
      );
      setPlacesVisitedIds(updated);
      updateStatsCount(type, updated.length);
    } else if (type === "cuisine") {
      const updated = await toggleCuisineVisited(
        id,
        { name: info.name, country: info.subtitle ?? "", imageUrl: info.imageUrl },
        cuisineVisitedIds,
      );
      setCuisineVisitedIds(updated);
      updateStatsCount(type, updated.length);
    }
  };

  const isHighlightVisited = (highlight: CatalogHighlight): boolean =>
    isTypeIdVisited(highlight.type, highlight.itemId);

  const handleToggleHighlight = (highlight: CatalogHighlight) =>
    toggleTypeId(highlight.type, highlight.itemId, {
      name: localizedHighlightTitle(highlight, language),
      subtitle: localizedHighlightSubtitle(highlight, language),
      imageUrl: highlight.imageUrl,
      iso2: highlight.iso2,
    });

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
              {t("home.greeting")}
            </Text>
            <Text style={{ marginTop: 3, fontSize: 13, color: palette.inkMuted }}>
              {t("home.greetingSubtitle")}
            </Text>
          </View>
          <LanguageSwitch compact />
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
              end={{ x: 1.5, y: 0.5 }}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                left: 0,
                width: "110%",
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
                {t("home.overallProgress")}
              </Text>
              {implementedStats.length === 0 ? (
                <Text style={{ marginTop: 6, fontSize: 12, color: palette.onDarkMuted }}>
                  {t("home.noDataYet")}
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
                        {t(c.titleKey)}{" "}
                        <Text
                          style={{
                            fontWeight: "700",
                            color: OVERALL_PROGRESS_VALUE_COLORS[c.fg] ?? c.fg,
                          }}
                        >
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
            {t("home.categories")}
          </Text>
          <Pressable
            onPress={() => router.push("/explore")}
            style={({ pressed }) => [
              { flexDirection: "row", alignItems: "center", gap: 2 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={{ fontSize: 12, color: palette.inkMuted }}>
              {t("home.seeAll")}
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
                          : cat.id === "cuisine"
                            ? router.push("/cuisine")
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

        {/* YOUR RECENT ACTIVITY — things the viewer themself marked recently
            (e.g. "I went to Athens"). Original small-row design — the big
            photo-card design below is reserved for our own "newly added"
            highlights, not the viewer's own activity. */}
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
              {t("home.recentlyAdded")}
            </Text>
            {recent.map((entry, i) => {
              const cat = getCategory(entry.type);
              const hasPhoto = !!entry.imageUrl;
              const displayTitle =
                entry.type === "places"
                  ? getLocalizedCountryName(
                      worldData.countries.find((c) => c.id === entry.id)?.name ??
                        entry.title,
                      language,
                    )
                  : entry.title;
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
                      {displayTitle}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 11, color: palette.inkMuted }}>
                      {cat ? t(cat.titleKey) : ""} · {timeAgo(entry.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* NEWLY ADDED — new content we've added across every list, not the
            viewer's own activity. Marking one visited/tasted here never
            removes it, since feed membership doesn't depend on that. */}
        {highlights.length > 0 && (
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
              {t("home.newlyAdded")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}
              style={{ marginHorizontal: -20 }}
            >
              {highlights.map((highlight) => {
                const category = getCategory(highlight.type);
                return (
                  <RecentItemCard
                    key={`${highlight.type}-${highlight.itemId}-${highlight.id}`}
                    type={highlight.type}
                    itemId={highlight.itemId}
                    title={localizedHighlightTitle(highlight, language)}
                    subtitle={localizedHighlightSubtitle(highlight, language)}
                    imageUrl={highlight.imageUrl}
                    iso2={highlight.iso2}
                    isVisited={isHighlightVisited(highlight)}
                    onToggle={
                      category?.implemented
                        ? () => handleToggleHighlight(highlight)
                        : undefined
                    }
                  />
                );
              })}
            </ScrollView>
          </>
        )}
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}
