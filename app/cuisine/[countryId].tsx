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
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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

  const renderItem = ({ item }: { item: CuisineMeal }) => {
    const isVisited = visited.includes(item.id);
    const name = localizedMealName(item, language);
    const city = localizedMealCity(item, language);
    const description = localizedMealDescription(item, language);

    return (
      <View
        style={{
          backgroundColor: palette.surface,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.hairline,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: 64, height: 64, borderRadius: 16 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: palette.creamDeep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="restaurant-outline" size={22} color={palette.coralText} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: palette.ink }}>
            {name}
          </Text>
          {city && !activeCityFilter && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 3 }}>
              <Ionicons name="location-outline" size={11} color={palette.inkMuted} />
              <Text style={{ fontSize: 11, color: palette.inkMuted }}>{city}</Text>
            </View>
          )}
          {description && (
            <Text
              style={{ marginTop: 4, fontSize: 12, color: palette.inkMuted }}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => handleToggle(item)}
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
      </View>
    );
  };

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
        <>
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

          <FlatList
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
            data={filteredMeals}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        </>
      )}
    </View>
  );
}
