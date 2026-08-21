import { CountryFlag } from "@/components/country-flag";
import { getCategory, type CategoryId } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

export const RECENT_ITEM_CARD_WIDTH = 148;
const CARD_HEIGHT = 190;

type RecentItemCardProps = {
  type: CategoryId;
  itemId: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  iso2?: string | null;
  isVisited: boolean;
  /** Omitted for categories that aren't markable yet (e.g. an upcoming
   * "islands" highlight before that list ships) — the toggle button is
   * hidden rather than shown disabled. */
  onToggle?: () => void;
};

/** A photo card for the home screen's "Son Eklenenler" rail — the newest
 * additions across every list (added by us, not the viewer), so members
 * discover what's new to mark. Its image is whatever was set on the
 * highlight itself, the same photo used everywhere else for that item. */
export function RecentItemCard({
  type,
  itemId,
  title,
  subtitle,
  imageUrl,
  iso2,
  isVisited,
  onToggle,
}: RecentItemCardProps) {
  const category = getCategory(type);
  const hasPhoto = !!imageUrl;
  const accent = category?.fg ?? palette.brand;

  return (
    <View
      style={{
        width: RECENT_ITEM_CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: category?.bg ?? palette.creamDeep,
      }}
    >
      {hasPhoto ? (
        <Image
          source={{ uri: imageUrl! }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {type === "places" ? (
            <CountryFlag id={itemId} iso2={iso2 ?? undefined} size={56} />
          ) : (
            <Ionicons name={category?.icon ?? "checkmark"} size={40} color={accent} />
          )}
        </View>
      )}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "60%",
        }}
      />

      {onToggle && (
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          style={({ pressed }) => [
            {
              position: "absolute",
              top: 10,
              right: 10,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isVisited ? accent : "rgba(255,255,255,0.85)",
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons
            name={isVisited ? "checkmark" : "ellipse-outline"}
            size={16}
            color={isVisited ? palette.surface : palette.inkFaint}
          />
        </Pressable>
      )}

      <View style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
        <Text
          numberOfLines={1}
          style={{ color: palette.surface, fontSize: 13, fontWeight: "700" }}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            numberOfLines={1}
            style={{ marginTop: 2, color: "rgba(255,255,255,0.75)", fontSize: 11 }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
