import { CountryFlag } from "@/components/country-flag";
import { YearPickerSheet } from "@/components/year-picker-sheet";
import { palette } from "@/constants/palette";
import { type Language, useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import type { CountryYears } from "@/data/profileExtras";
import worldData from "@/data/worldCountries.json";
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

type WorldCountry = { id: string; name: string; iso2?: string };
const COUNTRY_BY_ID = new Map<string, WorldCountry>(
  (worldData.countries as WorldCountry[]).map((c) => [c.id, c]),
);

// Stable pseudo-random tilt/colour per country, so a stamp never changes look
// between renders and the passport still looks hand-stamped.
function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function Stamp({
  country,
  language,
  size,
  year,
  addYearLabel,
  onPress,
}: {
  country: WorldCountry;
  language: Language;
  size: number;
  year: number | undefined;
  addYearLabel: string;
  onPress: () => void;
}) {
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
          fontSize: year ? 11 : 8,
          fontWeight: "800",
          color: year ? color : palette.inkFaint,
        }}
      >
        {year ?? addYearLabel}
      </Text>
    </Pressable>
  );
}

type Props = {
  /** Visited country ids in marking order (oldest first, as stored). */
  visitedIds: string[];
  /** Year visited per country id (optional, see data/countryYears.ts). */
  years: CountryYears;
  /** `null` clears the year. */
  onYearChange: (countryId: string, year: number | null) => void;
};

/** "Pasaportum": visited countries drawn as passport stamps, newest first.
 * Tapping a stamp sets the year it was visited. */
export function PassportStamps({ visitedIds, years, onYearChange }: Props) {
  const { t, language } = useLanguage();
  const { width } = useWindowDimensions();
  const size = Math.floor((width - HORIZONTAL_CHROME - STAMP_GAP * 2) / 3);
  const [expanded, setExpanded] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const all = useMemo(
    () =>
      visitedIds
        .map((id) => COUNTRY_BY_ID.get(id))
        .filter((c): c is WorldCountry => !!c)
        .reverse(),
    [visitedIds],
  );
  const shown = expanded ? all : all.slice(0, COLLAPSED_STAMPS);
  const extra = all.length - COLLAPSED_STAMPS;
  const picked = pickedId ? COUNTRY_BY_ID.get(pickedId) : undefined;

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
              year={years[c.id]}
              addYearLabel={t("me.addYear")}
              onPress={() => setPickedId(c.id)}
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

      <YearPickerSheet
        visible={picked !== undefined}
        title={picked ? getLocalizedCountryName(picked.name, language) : ""}
        selectedYear={pickedId ? years[pickedId] ?? null : null}
        onPick={(year) => {
          if (pickedId) onYearChange(pickedId, year);
          setPickedId(null);
        }}
        onClose={() => setPickedId(null)}
      />
    </View>
  );
}
