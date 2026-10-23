import { BadgeShowcase } from "@/components/badge-showcase";
import { BadgesSection } from "@/components/badges-section";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { OffscreenShareCard } from "@/components/offscreen-share-card";
import {
  availableShareCards,
  ProfileShareCard,
  type ProfileShareData,
  type ShareCardId,
} from "@/components/profile-share-card";
import { ProfileShareSheet } from "@/components/profile-share-sheet";
import { PassportStamps } from "@/components/passport-stamps";
import { ProfileHero } from "@/components/profile-hero";
import { SectionLabel } from "@/components/section-label";
import { TravelTimeline } from "@/components/travel-timeline";
import { SharePillButton } from "@/components/share-pill-button";
import { StatCard } from "@/components/stat-card";
import { WorldMapPreview } from "@/components/world-map-preview";
import { YearPickerSheet } from "@/components/year-picker-sheet";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { type Badge, type BadgeContext, computeBadges } from "@/data/badges";
import { loadBadgeShowcase, saveBadgeShowcase } from "@/data/badgeShowcase";
import { loadCountryYears, setCountryYears } from "@/data/countryYears";
import type { CountryYears } from "@/data/profileExtras";
import { getVisitedContinents } from "@/data/continents";
import { getWorldCountry } from "@/data/countryLookup";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { HERITAGE_VISITED_KEY } from "@/data/heritageStorage";
import { heritageSites } from "@/data/heritageSites";
import { parseIdList } from "@/data/parseIdList";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import { CUISINE_VISITED_KEY, ISLANDS_VISITED_KEY } from "@/data/storageKeys";
import { getProfileIdentity } from "@/data/profileIdentity";
import { getTitleKey } from "@/data/titles";
import { buildTravelTimeline } from "@/data/travelTimeline";
import worldData from "@/data/worldCountries.json";
import { useSession } from "@/hooks/use-session";
import { useShareStory } from "@/hooks/use-share-story";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const TOTAL_COUNTRIES = worldData.countries.length;

// "Profilim" — replaced the old Stats tab (app/(tabs)/stats.tsx). One scroll:
// hero → passport stamps → year timeline → world map → badge showcase →
// category counters → all badges. The header's share button opens a sheet to
// pick which card (components/profile-share-card.tsx) to share.
export default function MeScreen() {
  const { t, language } = useLanguage();
  const { session } = useSession();
  const [heritageCount, setHeritageCount] = useState(0);
  const [placesIds, setPlacesIds] = useState<string[]>([]);
  const [cuisineCount, setCuisineCount] = useState(0);
  const [islandsCount, setIslandsCount] = useState(0);
  const [ctx, setCtx] = useState<BadgeContext | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showcaseIds, setShowcaseIds] = useState<string[]>([]);
  const [years, setYears] = useState<CountryYears>({});
  // Country whose "which year?" sheet is open (opened from a stamp or a timeline flag).
  const [yearPickId, setYearPickId] = useState<string | null>(null);
  const { cardRef: shareCardRef, sharing, share: handleShare } = useShareStory();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCardId, setShareCardId] = useState<ShareCardId>("identity");
  const [shareYear, setShareYear] = useState<number | null>(null);

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

  // Adds or removes one year for a country. The screen state is updated first
  // so quick successive taps in the sheet build on each other; the full list is
  // then persisted.
  const saveYears = (countryId: string, list: number[]) => {
    setYears((prev) => {
      const next = { ...prev };
      if (list.length > 0) next[countryId] = list;
      else delete next[countryId];
      return next;
    });
    setCountryYears(countryId, list);
  };
  const toggleYear = (countryId: string, year: number) => {
    const current = years[countryId] ?? [];
    saveYears(
      countryId,
      current.includes(year)
        ? current.filter((y) => y !== year)
        : [...current, year].sort((a, b) => b - a),
    );
  };

  const yearPickCountry = yearPickId ? getWorldCountry(yearPickId) : undefined;

  const heritage = getCategory("heritage")!;
  const cuisine = getCategory("cuisine")!;
  const places = getCategory("places")!;
  const islands = getCategory("islands")!;

  const titleKey = ctx
    ? getTitleKey("places", ctx) ?? getTitleKey("heritage", ctx)
    : null;

  const shareData = useMemo<ProfileShareData>(() => {
    const { displayName, home } = getProfileIdentity(
      session?.user ?? null,
      t("me.guestName"),
    );
    const yearList = buildTravelTimeline(placesIds, years).years.map((g) => g.year);
    return {
      name: displayName,
      titleKey,
      home,
      placesIds,
      years,
      continents: getVisitedContinents(placesIds).size,
      heritage: heritageCount,
      cuisine: cuisineCount,
      islands: islandsCount,
      // The picked year if it still exists, else the newest one.
      year: shareYear !== null && yearList.includes(shareYear) ? shareYear : yearList[0] ?? null,
    };
  }, [session, t, titleKey, placesIds, years, heritageCount, cuisineCount, islandsCount, shareYear]);
  const availableCards = availableShareCards(shareData);
  const activeCardId = availableCards.includes(shareCardId) ? shareCardId : availableCards[0];

  // iOS can't present the share sheet while a Modal is still dismissing, so
  // close the picker first and share once it's gone.
  const handleShareChosen = () => {
    setShareOpen(false);
    setTimeout(handleShare, 400);
  };

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
            label={t("me.shareButton")}
            onPress={() => setShareOpen(true)}
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
          onStampPress={setYearPickId}
        />

        <SectionLabel>{t("me.timeline")}</SectionLabel>
        <TravelTimeline
          visitedIds={placesIds}
          years={years}
          onCountryPress={setYearPickId}
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

      {/* Never shown, only captured by useShareStory's share(): the card
          currently chosen in the share sheet. */}
      <OffscreenShareCard>
        <ProfileShareCard ref={shareCardRef} id={activeCardId} data={shareData} />
      </OffscreenShareCard>

      <ProfileShareSheet
        visible={shareOpen}
        data={shareData}
        cardId={activeCardId}
        onCardChange={setShareCardId}
        onYearChange={setShareYear}
        onShare={handleShareChosen}
        onClose={() => setShareOpen(false)}
      />

      <YearPickerSheet
        visible={yearPickCountry !== undefined}
        title={
          yearPickCountry
            ? getLocalizedCountryName(yearPickCountry.name, language)
            : ""
        }
        selectedYears={yearPickId ? years[yearPickId] ?? [] : []}
        onToggle={(year) => {
          if (yearPickId) toggleYear(yearPickId, year);
        }}
        onClear={() => {
          if (yearPickId) saveYears(yearPickId, []);
        }}
        onClose={() => setYearPickId(null)}
      />

      <BottomTabBar />
    </View>
  );
}
