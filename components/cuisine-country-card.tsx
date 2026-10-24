import { CountryFlag } from "@/components/country-flag";
import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

type CuisineCountryCardProps = {
  countryId: string;
  iso2: string;
  title: string;
  /** Photo of the country's first dish; a tinted tile when it has none. */
  imageUrl?: string | null;
  tasted: number;
  total: number;
  accentBg: string;
  accentFg: string;
  onPress: () => void;
};

/** One country in the cuisine picker's two-column grid: dish photo with the
 * flag on top, then "<Country> Mutfağı" and a tasted/total fraction. */
export function CuisineCountryCard({
  countryId,
  iso2,
  title,
  imageUrl,
  tasted,
  total,
  accentBg,
  accentFg,
  onPress,
}: CuisineCountryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        padding: 6,
        borderRadius: 20,
        backgroundColor: palette.surface,
        shadowColor: palette.shadow,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ height: 104, borderRadius: 16, overflow: "hidden" }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: accentBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="restaurant-outline" size={34} color={accentFg} />
          </View>
        )}

        <View
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderRadius: 6,
            backgroundColor: "rgba(255,255,255,0.85)",
          }}
        >
          <CountryFlag id={countryId} iso2={iso2} size={16} />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 6,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, fontWeight: "700", color: palette.ink }}
          >
            {title}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 12, color: palette.inkMuted }}>
            {tasted}/{total}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={palette.inkMuted} />
      </View>
    </Pressable>
  );
}
