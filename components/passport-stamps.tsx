import { CountryFlag } from "@/components/country-flag";
import { palette } from "@/constants/palette";
import { type Language, useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import type { CountryYears } from "@/data/profileExtras";
import { getWorldCountry, type WorldCountry } from "@/data/countryLookup";
import { useMemo, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

const COLLAPSED_STAMPS = 11;
const STAMP_GAP = 12;
// Screen padding (20 × 2) + card padding (16 × 2), see me.tsx / the card below.
const HORIZONTAL_CHROME = 72;
const INK_COLORS = [
  palette.brand,
  palette.blueText,
  palette.coralText,
  palette.violetText,
  palette.tealText,
  palette.amberText,
];

// Stable pseudo-random tilt/colour per country, so a stamp never changes look
// between renders and the passport still looks hand-stamped.
function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function Stamp({
  country,
  language,
  size,
  years,
  addYearLabel,
  onPress,
}: {
  country: WorldCountry;
  language: Language;
  size: number;
  /** Years visited, newest first; shown as the newest plus "+N" for the rest. */
  years: number[] | undefined;
  addYearLabel: string;
  onPress?: () => void;
}) {
  const hasYear = !!years && years.length > 0;
  const yearLabel = hasYear
    ? years.length > 1
      ? `${years[0]} +${years.length - 1}`
      : String(years[0])
    : "";
  const h = hashOf(country.id);
  const color = INK_COLORS[h % INK_COLORS.length];
  const tilt = ((h >> 3) % 17) - 8;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: color,
        borderRadius: 14,
        paddingHorizontal: 6,
        transform: [{ rotate: `${tilt}deg` }],
        opacity: 0.9,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          borderWidth: 1,
          borderColor: color,
          borderRadius: 10,
          opacity: 0.4,
          transform: [{ scale: 0.88 }],
        }}
      />
      <CountryFlag id={country.id} iso2={country.iso2} size={24} />
      <Text
        numberOfLines={2}
        style={{
          marginTop: 3,
          fontSize: 9,
          fontWeight: "800",
          letterSpacing: 0.5,
          textAlign: "center",
          textTransform: "uppercase",
          color,
        }}
      >
        {getLocalizedCountryName(country.name, language)}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontSize: hasYear ? 11 : 8,
          fontWeight: "800",
          color: hasYear ? color : palette.inkFaint,
        }}
      >
        {hasYear ? yearLabel : addYearLabel}
      </Text>
    </Pressable>
  );
}

type Props = {
  /** Visited country ids in marking order (oldest first, as stored). */
  visitedIds: string[];
  /** Year visited per country id (optional, see data/countryYears.ts). */
  years: CountryYears;
  /** A stamp was tapped: the screen opens the year picker for that country. */
  onStampPress: (countryId: string) => void;
};

/** "Pasaportum": visited countries drawn as passport stamps, newest first.
 * Tapping a stamp sets the year(s) it was visited. */
export function PassportStamps({ visitedIds, years, onStampPress }: Props) {
  const { t, language } = useLanguage();
  const { width } = useWindowDimensions();
  const size = Math.floor((width - HORIZONTAL_CHROME - STAMP_GAP * 2) / 3);
  const [expanded, setExpanded] = useState(false);

  const all = useMemo(
    () =>
      visitedIds
        .map((id) => getWorldCountry(id))
        .filter((c): c is WorldCountry => !!c)
        .reverse(),
    [visitedIds],
  );
  const shown = expanded ? all : all.slice(0, COLLAPSED_STAMPS);
  const extra = all.length - COLLAPSED_STAMPS;

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 18,
        padding: 16,
        shadowColor: palette.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      {all.length === 0 ? (
        <Text style={{ fontSize: 13, color: palette.inkMuted }}>
          {t("me.passportEmpty")}
        </Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: STAMP_GAP }}>
          {shown.map((c) => (
            <Stamp
              key={c.id}
              country={c}
              language={language}
              size={size}
              years={years[c.id]}
              addYearLabel={t("me.addYear")}
              onPress={() => onStampPress(c.id)}
            />
          ))}
          {extra > 0 ? (
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              style={{
                width: size,
                height: size,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: palette.inkFaint,
                borderRadius: 14,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: palette.inkMuted }}>
                {expanded ? t("me.showLess") : `+${extra}`}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}
