import { CountryFlag } from "@/components/country-flag";
import { ShareCardFrame } from "@/components/share-card-frame";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import type { WorldCountry } from "@/data/countryLookup";
import { forwardRef } from "react";
import { Text, View } from "react-native";

const MAX_FLAGS = 32;

type Props = {
  year: number;
  countries: WorldCountry[];
};

// One travel year: the year as a huge standalone number (no sentence — Turkish
// suffixes after a year change: "2019'da", "2020'de"), the country count and
// the flags.
export const ShareYearCard = forwardRef<View, Props>(function ShareYearCard(
  { year, countries },
  ref,
) {
  const { t } = useLanguage();

  return (
    <ShareCardFrame ref={ref} title={t("me.timeline")}>
      <View>
        <Text
          style={{
            fontSize: 96,
            lineHeight: 104,
            fontWeight: "800",
            color: palette.onDark,
          }}
        >
          {year}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "700", color: palette.onDarkMuted }}>
          {t("me.timelineCount", { count: countries.length })}
        </Text>
        <View style={{ marginTop: 22, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {countries.slice(0, MAX_FLAGS).map((c) => (
            <CountryFlag key={c.id} id={c.id} iso2={c.iso2} size={28} />
          ))}
        </View>
      </View>
    </ShareCardFrame>
  );
});
