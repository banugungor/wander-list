import { CountryFlag } from "@/components/country-flag";
import { ShareCardFrame } from "@/components/share-card-frame";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import type { WorldCountry } from "@/data/countryLookup";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { forwardRef } from "react";
import { Text, View } from "react-native";

type Props = {
  name: string;
  /** Translations key of the traveler title, or null. */
  titleKey: string | null;
  home: WorldCountry | undefined;
  countries: number;
  continents: number;
  heritage: number;
  cuisine: number;
};

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <View
      style={{
        width: "47%",
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: palette.onDarkTrack,
      }}
    >
      <Text style={{ fontSize: 34, lineHeight: 40, fontWeight: "800", color: palette.onDark }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: palette.onDarkMuted }}>{label}</Text>
    </View>
  );
}

// "Gezgin kartı": who the user is as a traveler — name, title, home country and
// the headline numbers.
export const ShareIdentityCard = forwardRef<View, Props>(
  function ShareIdentityCard(
    { name, titleKey, home, countries, continents, heritage, cuisine },
    ref,
  ) {
    const { t, language } = useLanguage();

    return (
      <ShareCardFrame ref={ref} title={t("me.shareCard.identity")}>
        <View>
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              backgroundColor: palette.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 38, fontWeight: "700", color: palette.onDark }}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text
            numberOfLines={2}
            style={{ marginTop: 14, fontSize: 30, fontWeight: "800", color: palette.onDark }}
          >
            {name}
          </Text>
          <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
            {titleKey ? (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: palette.brand,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: palette.onDark }}>
                  {t(titleKey)}
                </Text>
              </View>
            ) : null}
            {home ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <CountryFlag id={home.id} iso2={home.iso2} size={16} />
                <Text style={{ fontSize: 13, color: palette.onDarkMuted }}>
                  {getLocalizedCountryName(home.name, language)}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={{
              marginTop: 22,
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              rowGap: 12,
            }}
          >
            <Counter value={countries} label={t("me.countriesLabel")} />
            <Counter value={continents} label={t("me.continentsLabel")} />
            <Counter value={heritage} label={t("category.heritage")} />
            <Counter value={cuisine} label={t("category.cuisine")} />
          </View>
        </View>
      </ShareCardFrame>
    );
  },
);
