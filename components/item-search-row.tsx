import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export type ItemSearchRow = {
  key: string;
  title: string;
  /** Where the item lives — country name, or city name on a country screen. */
  subtitle: string;
  leading?: ReactNode;
  /** Replaces the default chevron (e.g. a checkbox in a picker). */
  trailing?: ReactNode;
  onPress: () => void;
};

/** One matching dish/island/landmark/heritage site in a category's search
 * results. Same card look as `ProgressRow`, minus the progress bar. */
export function ItemSearchRowView({ row }: { row: ItemSearchRow }) {
  return (
    <Pressable
      onPress={row.onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: palette.surface,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginHorizontal: 16,
          marginBottom: 10,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      {row.leading}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: palette.ink }}
          numberOfLines={1}
        >
          {row.title}
        </Text>
        <Text
          style={{ marginTop: 2, fontSize: 12, color: palette.inkMuted }}
          numberOfLines={1}
        >
          {row.subtitle}
        </Text>
      </View>
      {row.trailing ?? <Ionicons name="chevron-forward" size={15} color={palette.inkFaint} />}
    </Pressable>
  );
}
