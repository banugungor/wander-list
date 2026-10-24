import { BottomTabBar } from "@/components/bottom-tab-bar";
import { CountrySearchResults } from "@/components/country-search-results";
import { CuisineCountryCard } from "@/components/cuisine-country-card";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { SuggestionEntry } from "@/components/suggestion-entry";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { CONTINENT_BY_COUNTRY_ID, CONTINENTS, type ContinentId } from "@/data/continents";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { tastedCountByCountry } from "@/data/cuisineMeals";
import worldData from "@/data/worldCountries.json";
import { useCuisineMealIndex } from "@/hooks/use-cuisine-meal-index";
import { useCuisineVisited } from "@/hooks/use-cuisine-visited";
import { useCountrySearchRows } from "@/hooks/use-country-search-rows";
import { useNameIndexSearchRows } from "@/hooks/use-name-index-search-rows";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";

type Country = { id: string; name: string; iso2: string };
type ContinentFilter = "all" | ContinentId;

// Room for the overlaid bottom tab bar.
const TAB_BAR_SPACE = 110;

export default function CuisinePickerScreen() {
  const { t, language } = useLanguage();
  const categoryMeta = getCategory("cuisine");
  const accentFg = categoryMeta?.fg ?? palette.brand;
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [continentFilter, setContinentFilter] = useState<ContinentFilter>("all");

  const [visited] = useCuisineVisited();
  const { counts, countryByMealId, coverByCountry, loading } = useCuisineMealIndex();
  const tastedByCountry = useMemo(
    () => tastedCountByCountry(visited, countryByMealId),
    [visited, countryByMealId],
  );

  // Only countries that actually have dishes (same rule as the other pickers).
  const countriesWithContent = useMemo(
    () => (worldData.countries as Country[]).filter((c) => (counts[c.id] ?? 0) > 0),
    [counts],
  );

  // Continents that have at least one country with dishes, so a chip never
  // leads to an empty grid (e.g. Antarctica).
  const continentChips = useMemo(() => {
    const present = new Set(
      countriesWithContent.map((c) => CONTINENT_BY_COUNTRY_ID[c.id]),
    );
    return CONTINENTS.filter((continent) => present.has(continent.id));
  }, [countriesWithContent]);

  // Biggest cuisines first, like the mockup; ties by localized name.
  const gridCountries = useMemo(
    () =>
      countriesWithContent
        .filter(
          (c) =>
            continentFilter === "all" ||
            CONTINENT_BY_COUNTRY_ID[c.id] === continentFilter,
        )
        .sort(
          (a, b) =>
            (counts[b.id] ?? 0) - (counts[a.id] ?? 0) ||
            getLocalizedCountryName(a.name, language).localeCompare(
              getLocalizedCountryName(b.name, language),
            ),
        ),
    [countriesWithContent, continentFilter, counts, language],
  );

  // While searching, the grid is replaced by a flat list of every matching
  // country (across all continents) that has content.
  const searchRows = useCountrySearchRows({
    search,
    language,
    totals: counts,
    done: tastedByCountry,
    routeBase: "cuisine",
  });

  // ...plus individual cuisine matches by name, from a lazily-loaded names index.
  const { rows: itemRows, loading: itemsLoading } = useNameIndexSearchRows({
    category: "cuisine",
    search,
    language,
  });

  const totalMeals = Object.values(counts).reduce((sum, c) => sum + c, 0);

  const toggleSearch = () => {
    if (searchOpen) setSearch("");
    setSearchOpen(!searchOpen);
  };

  const searching = search.trim().length > 0;
  // An odd count would stretch the last card over the full row.
  const gridData: (Country | null)[] =
    gridCountries.length % 2 === 1 ? [...gridCountries, null] : gridCountries;

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={categoryMeta ? t(categoryMeta.titleKey) : t("category.cuisine")}
        subtitle={
          totalMeals > 0
            ? t("cuisinePicker.progressDetail", { count: visited.length, total: totalMeals })
            : undefined
        }
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
        right={
          <Pressable
            onPress={toggleSearch}
            accessibilityLabel={t("cuisinePicker.searchOpen")}
            style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons
              name={searchOpen ? "close" : "search"}
              size={22}
              color={palette.ink}
            />
          </Pressable>
        }
      />

      {searchOpen ? (
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t("explore.searchPlaceholder")}
        />
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={palette.brand} />
          <Text style={{ marginTop: 12, color: palette.inkMuted }}>
            {t("explore.loading")}
          </Text>
        </View>
      ) : searching ? (
        <CountrySearchResults
          rows={searchRows}
          accentColor={accentFg}
          itemRows={itemRows}
          itemsLoading={itemsLoading}
          rowsTitle={t("explore.sectionCountries")}
          itemsTitle={t("explore.sectionDishes")}
          bottomPadding={TAB_BAR_SPACE}
          footer={
            <SuggestionEntry category="cuisine" accentColor={categoryMeta?.fg} />
          }
        />
      ) : (
        <>
          <View style={{ height: 56, marginTop: 16 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
            >
              {(
                [
                  { id: "all", label: t("common.all") },
                  ...continentChips.map((continent) => ({
                    id: continent.id,
                    label: language === "tr" ? continent.name : continent.nameEn,
                  })),
                ] as { id: ContinentFilter; label: string }[]
              ).map((chip) => {
                const active = continentFilter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => setContinentFilter(chip.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: active ? palette.brand : palette.surface,
                      borderWidth: active ? 0 : 1,
                      borderColor: palette.hairline,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: active ? palette.surface : palette.inkMuted,
                      }}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            numColumns={2}
            columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
            contentContainerStyle={{ gap: 12, paddingTop: 4, paddingBottom: TAB_BAR_SPACE }}
            data={gridData}
            keyExtractor={(item, index) => item?.id ?? `spacer-${index}`}
            renderItem={({ item }) =>
              item ? (
                <CuisineCountryCard
                  countryId={item.id}
                  iso2={item.iso2}
                  title={t("cuisinePicker.countryCardTitle", {
                    country: getLocalizedCountryName(item.name, language),
                  })}
                  imageUrl={coverByCountry[item.id]}
                  tasted={tastedByCountry[item.id] ?? 0}
                  total={counts[item.id] ?? 0}
                  accentBg={categoryMeta?.bg ?? palette.creamDeep}
                  accentFg={accentFg}
                  onPress={() => router.push(`/cuisine/${item.id}`)}
                />
              ) : (
                <View style={{ flex: 1 }} />
              )
            }
            ListFooterComponent={
              <SuggestionEntry category="cuisine" accentColor={categoryMeta?.fg} />
            }
          />
        </>
      )}

      <BottomTabBar />
    </View>
  );
}
