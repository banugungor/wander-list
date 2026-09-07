import { EntryListRow } from "@/components/entry-list-row";
import { ProgressCard } from "@/components/progress-card";
import { ScreenHeader } from "@/components/screen-header";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import {
  localizedMealCity,
  localizedMealDescription,
  localizedMealName,
  type CuisineMeal,
} from "@/data/cuisineMeals";
import { toggleCuisineVisited } from "@/data/cuisineVisited";
import worldData from "@/data/worldCountries.json";
import { useCountryMeals } from "@/hooks/use-country-meals";
import { useCuisineVisited } from "@/hooks/use-cuisine-visited";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function CuisineCountryMealsScreen() {
  const { t, language } = useLanguage();
  const { countryId } = useLocalSearchParams();
  const id = Array.isArray(countryId) ? countryId[0] : countryId ?? "";

  const country = useMemo(
    () => worldData.countries.find((c) => c.id === id),
    [id],
  );
  const countryName = country
    ? getLocalizedCountryName(country.name, language)
    : t("explore.detailsTitle");

  const categoryMeta = getCategory("cuisine");
  const { meals, loading } = useCountryMeals(id);
  const [visited, setVisited] = useCuisineVisited();
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  const cities = useMemo(() => {
    const set = new Set<string>();
    meals.forEach((m) => {
      const city = localizedMealCity(m, language);
      if (city) set.add(city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [meals, language]);

  // Reset the filter if the selected city no longer exists for this country
  // (e.g. the data was just refreshed from Supabase).
  const activeCityFilter = cityFilter && cities.includes(cityFilter) ? cityFilter : null;

  const filteredMeals = activeCityFilter
    ? meals.filter((m) => localizedMealCity(m, language) === activeCityFilter)
    : meals;

  const tastedInCountry = meals.filter((m) => visited.includes(m.id)).length;
  const percent =
    meals.length > 0 ? Math.min(100, Math.round((tastedInCountry / meals.length) * 100)) : 0;

  const handleToggle = async (meal: CuisineMeal) => {
    const updated = await toggleCuisineVisited(
      meal.id,
      {
        name: localizedMealName(meal, language),
        country: countryName,
        imageUrl: meal.imageUrl,
      },
      visited,
    );
    setVisited(updated);
  };

  const renderItem = ({ item }: { item: CuisineMeal }) => (
    <EntryListRow
      name={localizedMealName(item, language)}
      description={localizedMealDescription(item, language)}
      city={activeCityFilter ? null : localizedMealCity(item, language)}
      imageUrl={item.imageUrl}
      icon="restaurant-outline"
      iconColor={palette.coralText}
      isVisited={visited.includes(item.id)}
      toggleColor={categoryMeta?.fg ?? palette.brand}
      onTogglePress={() => handleToggle(item)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={countryName}
        accentBg={categoryMeta?.bg}
        accentFg={categoryMeta?.fg}
      />

      {loading && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={palette.brand} />
          <Text style={{ marginTop: 12, color: palette.inkMuted }}>
            {t("cuisineCountry.loading")}
          </Text>
        </View>
      )}

      {!loading && meals.length === 0 && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: palette.inkMuted,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {t("cuisineCountry.empty")}
          </Text>
        </View>
      )}

      {!loading && meals.length > 0 && (
        <FlatList
          contentContainerStyle={{ paddingBottom: 40 }}
          data={filteredMeals}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ marginBottom: 16 }}>
              <ProgressCard
                label={t("cuisineCountry.tasted")}
                detail={t("explore.progressDetail", {
                  count: tastedInCountry,
                  total: meals.length,
                })}
                percent={percent}
                accentBg={categoryMeta?.bg}
                accentFg={categoryMeta?.fg}
              />

              {cities.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0, marginTop: 12 }}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {[null, ...cities].map((city) => {
                    const active = activeCityFilter === city;
                    return (
                      <Pressable
                        key={city ?? "all"}
                        onPress={() => setCityFilter(city)}
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
                          {city ?? t("common.all")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}
