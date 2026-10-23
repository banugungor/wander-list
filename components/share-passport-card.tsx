import { ShareCardFrame } from "@/components/share-card-frame";
import { Stamp } from "@/components/passport-stamps";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getWorldCountry, type WorldCountry } from "@/data/countryLookup";
import type { CountryYears } from "@/data/profileExtras";
import { forwardRef } from "react";
import { Text, View } from "react-native";

const MAX_STAMPS = 9;
const STAMP_SIZE = 88;
const STAMP_GAP = 10;

type Props = {
  /** Visited country ids in marking order (oldest first, as stored). */
  visitedIds: string[];
  years: CountryYears;
};

// The newest visited countries as stamps on a "passport page" panel. Shown
// without a year when none was set (the stamp just omits it).
export const SharePassportCard = forwardRef<View, Props>(
  function SharePassportCard({ visitedIds, years }, ref) {
    const { t, language } = useLanguage();
    const countries = visitedIds
      .map((id) => getWorldCountry(id))
      .filter((c): c is WorldCountry => !!c)
      .reverse();
    const shown = countries.slice(0, MAX_STAMPS);
    const extra = countries.length - shown.length;

    return (
      <ShareCardFrame ref={ref} title={t("me.passport")}>
        <View>
          <View
            style={{
              padding: 14,
              borderRadius: 18,
              backgroundColor: palette.cream,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: STAMP_GAP,
            }}
          >
            {shown.map((c) => (
              <Stamp
                key={c.id}
                country={c}
                language={language}
                size={STAMP_SIZE}
                years={years[c.id]}
                addYearLabel=""
              />
            ))}
          </View>
          {extra > 0 ? (
            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                fontWeight: "700",
                color: palette.onDark,
              }}
            >
              +{extra} {t("me.countriesLabel")}
            </Text>
          ) : null}
        </View>
      </ShareCardFrame>
    );
  },
);
