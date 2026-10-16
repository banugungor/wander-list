import { CountryFlag } from "@/components/country-flag";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { findHeritageCountryToken } from "@/data/heritageContinents";
import worldData from "@/data/worldCountries.json";
import { useCuisineMealIndex } from "@/hooks/use-cuisine-meal-index";
import { useSession } from "@/hooks/use-session";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

// Signed-out users have no profile country; the app's default language is
// Turkish, so Turkey is the sensible guess for them.
const DEFAULT_COUNTRY_ID_TR = "792";

type Shortcut = {
  key: string;
  categoryId: "places" | "heritage" | "cuisine";
  title: string;
  subtitle: string;
  href: string;
  /** Subtitle is the user's country name, so show its flag beside it. */
  withFlag?: boolean;
};

/** First-run card on the home screen: a few one-tap shortcuts that land
 * straight on a list the user can start ticking (their own country's UNESCO
 * sites / dishes, the world map), instead of a wall of empty categories.
 * The caller decides when it's still needed (few marks so far). */
export function StartHereCard() {
  const { t, language } = useLanguage();
  const { session } = useSession();
  const { counts: mealCounts } = useCuisineMealIndex();

  const country = useMemo(() => {
    const raw = session?.user.user_metadata?.country_id;
    const id =
      typeof raw === "string" && raw ? raw : language === "tr" ? DEFAULT_COUNTRY_ID_TR : null;
    return id ? (worldData.countries.find((c) => c.id === id) ?? null) : null;
  }, [session, language]);

  const shortcuts = useMemo<Shortcut[]>(() => {
    const list: Shortcut[] = [
      {
        key: "places",
        categoryId: "places",
        title: t("startHere.places"),
        subtitle: t("startHere.placesHint"),
        href: "/places-map",
      },
    ];

    const heritageToken = country ? findHeritageCountryToken(country.name) : null;
    list.push({
      key: "heritage",
      categoryId: "heritage",
      title: t("startHere.heritage"),
      subtitle: heritageToken ? getLocalizedCountryName(heritageToken, language) : t("startHere.heritageHint"),
      withFlag: !!heritageToken,
      href: heritageToken ? `/heritage/country/${encodeURIComponent(heritageToken)}` : "/heritage",
    });

    // Only deep-link a country's dishes when it actually has some.
    const hasMeals = country ? (mealCounts[country.id] ?? 0) > 0 : false;
    list.push({
      key: "cuisine",
      categoryId: "cuisine",
      title: t("startHere.cuisine"),
      subtitle: country && hasMeals ? getLocalizedCountryName(country.name, language) : t("startHere.cuisineHint"),
      withFlag: hasMeals,
      href: country && hasMeals ? `/cuisine/${country.id}` : "/cuisine",
    });
    return list;
  }, [country, language, mealCounts, t]);

  return (
    <View style={{ marginTop: 20 }}>
      <Text
        style={{
          marginBottom: 10,
          fontSize: 11,
          fontWeight: "700",
          color: palette.inkMuted,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {t("startHere.title")}
      </Text>

      <View style={{ gap: 8 }}>
        {shortcuts.map((s) => {
          const category = getCategory(s.categoryId);
          return (
            <Pressable
              key={s.key}
              onPress={() => router.push(s.href as never)}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: palette.surface,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: category?.bg ?? palette.creamDeep,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={category?.icon ?? "ellipse-outline"}
                  size={20}
                  color={category?.fg ?? palette.brand}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: palette.ink }} numberOfLines={1}>
                  {s.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  {s.withFlag && country ? <CountryFlag id={country.id} iso2={country.iso2} size={12} /> : null}
                  <Text style={{ fontSize: 12, color: palette.inkMuted }} numberOfLines={1}>
                    {s.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={15} color={palette.inkFaint} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
