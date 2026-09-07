import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type EntryListRowProps = {
  name: string;
  description?: string | null;
  city?: string | null;
  imageUrl?: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  isVisited: boolean;
  toggleColor: string;
  onTogglePress: () => void;
};

// Shared row for the Cuisine/Islands country screens (`app/cuisine/[countryId].tsx`,
// `app/islands/[countryId].tsx`): icon/photo thumbnail, name, optional city
// line, a description that starts 2-line-clamped and expands in place on tap
// (long descriptions used to just get cut off with no way to read the rest —
// see the "Dobos Torta" case), and the visited/tasted toggle circle on the
// right. Only the toggle circle flips visited state; tapping the rest of the
// row only expands/collapses the description.
export function EntryListRow({
  name,
  description,
  city,
  imageUrl,
  icon,
  iconColor,
  isVisited,
  toggleColor,
  onTogglePress,
}: EntryListRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: palette.hairline,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 64, height: 64, borderRadius: 16 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: palette.creamDeep,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
      )}

      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        disabled={!description}
        style={{ flex: 1 }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: palette.ink }}>
          {name}
        </Text>
        {city && (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 3 }}>
            <Ionicons name="location-outline" size={11} color={palette.inkMuted} />
            <Text style={{ fontSize: 11, color: palette.inkMuted }}>{city}</Text>
          </View>
        )}
        {description && (
          <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 4, gap: 4 }}>
            <Text
              style={{ flex: 1, fontSize: 12, color: palette.inkMuted, lineHeight: 17 }}
              numberOfLines={expanded ? undefined : 2}
            >
              {description}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={13}
              color={palette.inkFaint}
              style={{ marginTop: 2 }}
            />
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={onTogglePress}
        hitSlop={8}
        style={({ pressed }) => [
          {
            width: 34,
            height: 34,
            borderRadius: 17,
            marginTop: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isVisited ? toggleColor : palette.cream,
            borderWidth: isVisited ? 0 : 1,
            borderColor: palette.hairline,
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Ionicons
          name={isVisited ? "checkmark" : "ellipse-outline"}
          size={17}
          color={isVisited ? palette.surface : palette.inkFaint}
        />
      </Pressable>
    </View>
  );
}
