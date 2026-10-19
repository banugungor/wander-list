import { CountryFlag } from "@/components/country-flag";
import { palette } from "@/constants/palette";
import { findCountry } from "@/data/trips";
import { useCountryImageUrl } from "@/hooks/use-country-image-url";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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

/** The trip card background: the country's cover photo (data/countryImages.ts)
 * when it has one, else a per-trip gradient with the country's flag (or a
 * plane, when no country is set) as a faded watermark. The photo gets a dark
 * scrim at the bottom so white text on top stays readable. */
export function TripCover({
  title,
  countryId,
  style,
  markSize = 96,
  children,
}: TripCoverProps) {
  const country = findCountry(countryId);
  const photoUrl = useCountryImageUrl(countryId);

  if (photoUrl) {
    return (
      <View style={[{ overflow: "hidden", backgroundColor: palette.creamDeep }, style]}>
        <Image
          source={{ uri: photoUrl }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.55)"]}
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {children}
      </View>
    );
  }

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
