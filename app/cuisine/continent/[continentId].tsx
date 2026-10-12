import { CountryFlag } from "@/components/country-flag";
import { ProgressCard } from "@/components/progress-card";
import { ProgressRow } from "@/components/progress-row";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { CONTINENT_BY_COUNTRY_ID, CONTINENTS } from "@/data/continents";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { tastedCountByCountry } from "@/data/cuisineMeals";
import worldData from "@/data/worldCountries.json";
import { matchesSearch } from "@/data/searchText";
import { useCuisineMealIndex } from "@/hooks/use-cuisine-meal-index";
import { useCuisineVisited } from "@/hooks/use-cuisine-visited";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

type Country = { id: string; name: string; iso2: string };
type Filter = "all" | "tasted" | "untasted";

export default function CuisineContinentCountriesScreen() {
  const { t, language } = useLanguage();
  const { continentId } = useLocalSearchParams();
  const id = Array.isArray(continentId) ? continentId[0] : continentId ?? "";
  const continent = CONTINENTS.find((c) => c.id === id);
  const categoryMeta = getCategory("cuisine");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [visited] = useCuisineVisited();
  const { counts, countryByMealId } = useCuisineMealIndex();
  const tastedByCountry = useMemo(
    () => tastedCountByCountry(visited, countryByMealId),
    [visited, countryByMealId],
  );

  const countries = useMemo(
    () =>
      (worldData.countries as Country[]).filter(
        (c) => CONTINENT_BY_COUNTRY_ID[c.id] === id,
      ),
    [id],
  );

  const total = countries.reduce((sum, c) => sum + (counts[c.id] ?? 0), 0);
  const tasted = countries.reduce((sum, c) => sum + (tastedByCountry[c.id] ?? 0), 0);
  const percent = total > 0 ? Math.min(100, Math.round((tasted / total) * 100)) : 0;

  const filteredCountries = useMemo(() => {
    return countries
      .filter((c) => {
        if (!matchesSearch(search, c.name, getLocalizedCountryName(c.name, language))) return false;
        const countryTasted = tastedByCountry[c.id] ?? 0;
        if (filter === "tasted" && countryTasted === 0) return false;
        if (filter === "untasted" && countryTasted > 0) return false;
        return true;
      })
      .sort((a, b) =>
        getLocalizedCountryName(a.name, language).localeCompare(
          getLocalizedCountryName(b.name, language),
        ),
      );
  }, [countries, search, filter, tastedByCountry, language]);

  const continentName = continent
    ? language === "tr"
      ? continent.name
      : continent.nameEn
    : "";

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={continentName}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <ProgressCard
        label={t("cuisinePicker.continentLabel", { continent: continentName })}
        detail={t("cuisinePicker.progressDetail", { count: tasted, total })}
        percent={percent}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t("explore.searchPlaceholder")}
      />

      <View style={{ flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 12 }}>
        {(
          [
            { id: "all", label: t("common.all") },
            { id: "tasted", label: t("cuisinePicker.filterTasted") },
            { id: "untasted", label: t("cuisinePicker.filterUntasted") },
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
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        data={filteredCountries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
            {t("explore.noResults")}
          </Text>
        }
        renderItem={({ item }) => {
          const countryTotal = counts[item.id] ?? 0;
          const countryTasted = tastedByCountry[item.id] ?? 0;
          const rowPercent =
            countryTotal > 0 ? Math.round((countryTasted / countryTotal) * 100) : 0;
          return (
            <ProgressRow
              leading={<CountryFlag id={item.id} iso2={item.iso2} size={20} />}
              title={getLocalizedCountryName(item.name, language)}
              fractionLabel={
                countryTotal > 0
                  ? `${countryTasted}/${countryTotal}`
                  : t("cuisinePicker.noMealsYet")
              }
              percent={rowPercent}
              accentColor={categoryMeta?.fg ?? palette.brand}
              onPress={() => router.push(`/cuisine/${item.id}`)}
            />
          );
        }}
      />
    </View>
  );
}
