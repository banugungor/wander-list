import { BadgeShowcase } from "@/components/badge-showcase";
import { BadgesSection } from "@/components/badges-section";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { OffscreenShareCard } from "@/components/offscreen-share-card";
import { PassportStamps } from "@/components/passport-stamps";
import { ProfileHero } from "@/components/profile-hero";
import { SectionLabel } from "@/components/section-label";
import { SharePillButton } from "@/components/share-pill-button";
import { ShareStoryCard } from "@/components/share-story-card";
import { StatCard } from "@/components/stat-card";
import { WorldMapPreview } from "@/components/world-map-preview";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { type Badge, type BadgeContext, computeBadges } from "@/data/badges";
import { loadBadgeShowcase, saveBadgeShowcase } from "@/data/badgeShowcase";
import { loadCountryYears, setCountryYear } from "@/data/countryYears";
import type { CountryYears } from "@/data/profileExtras";
import { getVisitedContinents } from "@/data/continents";
import { HERITAGE_VISITED_KEY } from "@/data/heritageStorage";
import { heritageSites } from "@/data/heritageSites";
import { parseIdList } from "@/data/parseIdList";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import { CUISINE_VISITED_KEY, ISLANDS_VISITED_KEY } from "@/data/storageKeys";
import { getTitleKey } from "@/data/titles";
import worldData from "@/data/worldCountries.json";
import { useSession } from "@/hooks/use-session";
import { useShareStory } from "@/hooks/use-share-story";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const TOTAL_COUNTRIES = worldData.countries.length;

// "Profilim" — replaced the old Stats tab (app/(tabs)/stats.tsx). One scroll:
// hero → passport stamps → world map → badge showcase → category counters →
// all badges.
export default function MeScreen() {
  const { t } = useLanguage();
  const { session } = useSession();
  const [heritageCount, setHeritageCount] = useState(0);
  const [placesIds, setPlacesIds] = useState<string[]>([]);
  const [cuisineCount, setCuisineCount] = useState(0);
  const [islandsCount, setIslandsCount] = useState(0);
  const [ctx, setCtx] = useState<BadgeContext | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showcaseIds, setShowcaseIds] = useState<string[]>([]);
  const [years, setYears] = useState<CountryYears>({});
  const { cardRef: shareCardRef, sharing, share: handleShare } = useShareStory();

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [heritageRaw, placesRaw, cuisineRaw, islandsRaw, showcase, countryYears] =
            await Promise.all([
              AsyncStorage.getItem(HERITAGE_VISITED_KEY),
              AsyncStorage.getItem(PLACES_VISITED_KEY),
              AsyncStorage.getItem(CUISINE_VISITED_KEY),
              AsyncStorage.getItem(ISLANDS_VISITED_KEY),
              loadBadgeShowcase(),
              loadCountryYears(),
            ]);
          const heritageVisited = parseIdList(heritageRaw).length;
          const places = parseIdList(placesRaw);
          const nextCtx: BadgeContext = {
            heritageVisitedCount: heritageVisited,
            heritageTotal: heritageSites.length,
            countriesVisitedIds: places,
          };
          setHeritageCount(heritageVisited);
          setPlacesIds(places);
          setCuisineCount(parseIdList(cuisineRaw).length);
          setIslandsCount(parseIdList(islandsRaw).length);
          setCtx(nextCtx);
          setBadges(computeBadges(nextCtx));
          setShowcaseIds(showcase);
          setYears(countryYears);
        } catch (e) {
          console.log("PROFILE LOAD ERROR", e);
        }
      };
      load();
    }, []),
  );

  const changeShowcase = (ids: string[]) => {
    setShowcaseIds(ids);
    saveBadgeShowcase(ids);
  };

  const changeYear = async (countryId: string, year: number | null) => {
    setYears(await setCountryYear(countryId, year));
  };

  const heritage = getCategory("heritage")!;
  const cuisine = getCategory("cuisine")!;
  const places = getCategory("places")!;
  const islands = getCategory("islands")!;

  const titleKey = ctx
    ? getTitleKey("places", ctx) ?? getTitleKey("heritage", ctx)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 64,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: palette.ink }}>
            {t("me.title")}
          </Text>
          <SharePillButton
            label={t("stats.shareButton")}
            onPress={handleShare}
            loading={sharing}
          />
        </View>

        <ProfileHero
          user={session?.user ?? null}
          titleKey={titleKey}
          countriesVisited={placesIds.length}
          continentsVisited={getVisitedContinents(placesIds).size}
        />

        <SectionLabel>{t("me.passport")}</SectionLabel>
        <PassportStamps
          visitedIds={placesIds}
          years={years}
          onYearChange={changeYear}
        />

        <SectionLabel>{t("shareWorld.title")}</SectionLabel>
        <Pressable
          onPress={() => router.push("/places-map")}
          style={{
            padding: 12,
            borderRadius: 18,
            backgroundColor: palette.surface,
            shadowColor: palette.shadow,
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 1,
          }}
        >
          <WorldMapPreview visitedIds={placesIds} />
          <Text style={{ marginTop: 8, fontSize: 12, color: palette.inkMuted }}>
            {t("shareWorld.countries", {
              count: placesIds.length,
              total: TOTAL_COUNTRIES,
            })}
          </Text>
        </Pressable>

        <SectionLabel>{t("me.showcase")}</SectionLabel>
        <BadgeShowcase
          badges={badges}
          showcaseIds={showcaseIds}
          onChange={changeShowcase}
        />

        <SectionLabel>{t("me.collection")}</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <StatCard
            label={t(heritage.titleKey)}
            value={heritageCount}
            icon={heritage.icon}
            bg={heritage.bg}
            fg={heritage.fg}
          />
          <StatCard
            label={t(cuisine.titleKey)}
            value={cuisineCount}
            icon={cuisine.icon}
            bg={cuisine.bg}
            fg={cuisine.fg}
          />
          <StatCard
            label={t(places.titleKey)}
            value={placesIds.length}
            icon={places.icon}
            bg={places.bg}
            fg={places.fg}
          />
          <StatCard
            label={t(islands.titleKey)}
            value={islandsCount}
            icon={islands.icon}
            bg={islands.bg}
            fg={islands.fg}
          />
        </View>

        <SectionLabel>{t("badges.title")}</SectionLabel>
        <BadgesSection badges={badges} ctx={ctx} />
      </ScrollView>

      {/* Never shown, only captured by useShareStory's share(). */}
      <OffscreenShareCard>
        <ShareStoryCard
          ref={shareCardRef}
          heritageCount={heritageCount}
          placesCount={placesIds.length}
          cuisineCount={cuisineCount}
          islandsCount={islandsCount}
          title={t("stats.shareCardTitle")}
          footer={t("stats.shareCardFooter")}
        />
      </OffscreenShareCard>

      <BottomTabBar />
    </View>
  );
}
