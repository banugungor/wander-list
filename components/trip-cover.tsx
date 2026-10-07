import { CountryFlag } from "@/components/country-flag";
import { palette } from "@/constants/palette";
import { findCountry } from "@/data/trips";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

// Dark enough that white text on top stays readable.
const GRADIENTS: [string, string][] = [
  [palette.brand, "#0C2426"],
  [palette.blueText, "#1B2F5B"],
  [palette.violetText, "#2B1A5C"],
  [palette.coralText, "#7A2E0B"],
  [palette.tealText, "#0B3B3A"],
  [palette.amberText, "#5A3B05"],
];

/** Same title always lands on the same gradient, so a card keeps its look. */
function gradientFor(title: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

type TripCoverProps = {
  title: string;
  countryId: string | null;
  style?: StyleProp<ViewStyle>;
  /** Size of the faded flag (or plane) watermark. */
  markSize?: number;
  children?: ReactNode;
};

/** The trip card background: a per-trip gradient with the country's flag (or
 * a plane, when no country is set) as a faded watermark. Stands in for a
 * photo — there's no photo source for trips yet. */
export function TripCover({
  title,
  countryId,
  style,
  markSize = 96,
  children,
}: TripCoverProps) {
  const country = findCountry(countryId);

  return (
    <LinearGradient
      colors={gradientFor(title)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ overflow: "hidden" }, style]}
    >
      <View
        pointerEvents="none"
        style={{ position: "absolute", right: -6, top: -4, opacity: 0.35 }}
      >
        {country ? (
          <CountryFlag id={country.id} iso2={country.iso2} size={markSize} />
        ) : (
          <Ionicons name="airplane" size={markSize} color={palette.onDark} />
        )}
      </View>
      {children}
    </LinearGradient>
  );
}
