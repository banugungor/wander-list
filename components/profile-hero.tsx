import { CountryFlag } from "@/components/country-flag";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import worldData from "@/data/worldCountries.json";
import { Ionicons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

type WorldCountry = { id: string; name: string; iso2?: string };

function metaString(user: User | null | undefined, key: string): string {
  const value = user?.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

type Props = {
  user: User | null;
  /** Translations key of the traveler title, or null before the first mark. */
  titleKey: string | null;
  countriesVisited: number;
  continentsVisited: number;
};

/** Top card of the profile: avatar (initial), name, home-country flag,
 * traveler title and the two headline numbers. Signed-out users get a
 * generic guest card with a sign-in button. */
export function ProfileHero({
  user,
  titleKey,
  countriesVisited,
  continentsVisited,
}: Props) {
  const { t, language } = useLanguage();

  const fullName = [metaString(user, "first_name"), metaString(user, "last_name")]
    .filter(Boolean)
    .join(" ");
  const displayName = fullName || user?.email?.split("@")[0] || t("me.guestName");
  const homeId = metaString(user, "country_id");
  const home = homeId
    ? (worldData.countries as WorldCountry[]).find((c) => c.id === homeId)
    : undefined;

  return (
    <View
      style={{
        alignItems: "center",
        padding: 20,
        borderRadius: 20,
        backgroundColor: palette.surface,
        shadowColor: palette.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: palette.greenSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {user ? (
          <Text style={{ fontSize: 30, fontWeight: "700", color: palette.brand }}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        ) : (
          <Ionicons name="person" size={32} color={palette.brand} />
        )}
      </View>

      <Text
        style={{ marginTop: 12, fontSize: 19, fontWeight: "700", color: palette.ink }}
      >
        {displayName}
      </Text>

      {home ? (
        <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <CountryFlag id={home.id} iso2={home.iso2} size={14} />
          <Text style={{ fontSize: 12, color: palette.inkMuted }}>
            {getLocalizedCountryName(home.name, language)}
          </Text>
        </View>
      ) : null}

      {titleKey ? (
        <View
          style={{
            marginTop: 10,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: palette.greenSoft,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: palette.greenText }}>
            {t(titleKey)}
          </Text>
        </View>
      ) : null}

      <View style={{ marginTop: 16, flexDirection: "row", gap: 28 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: palette.ink }}>
            {countriesVisited}
          </Text>
          <Text style={{ fontSize: 11, color: palette.inkMuted }}>
            {t("me.countriesLabel")}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: palette.ink }}>
            {continentsVisited}
          </Text>
          <Text style={{ fontSize: 11, color: palette.inkMuted }}>
            {t("me.continentsLabel")}
          </Text>
        </View>
      </View>

      {!user ? (
        <Pressable
          onPress={() => router.push("/auth")}
          style={{
            marginTop: 16,
            paddingHorizontal: 18,
            paddingVertical: 9,
            borderRadius: 999,
            backgroundColor: palette.brand,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: palette.surface }}>
            {t("profile.signInCta")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
