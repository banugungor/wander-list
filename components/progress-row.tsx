import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type ProgressRowProps = {
  leading?: ReactNode;
  title: string;
  fractionLabel: string;
  percent: number;
  accentColor: string;
  onPress: () => void;
};

/** A pressable card row with a title, a right-aligned fraction/label, and a
 * thin progress bar underneath. Shared by the cuisine continent and country
 * picker screens so both levels of the drill-down look and feel the same. */
export function ProgressRow({
  leading,
  title,
  fractionLabel,
  percent,
  accentColor,
  onPress,
}: ProgressRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: palette.surface,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginHorizontal: 16,
          marginBottom: 10,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flex: 1,
            marginRight: 10,
          }}
        >
          {leading}
          <Text
            style={{ fontSize: 15, fontWeight: "600", color: palette.ink }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 13, color: palette.inkMuted }}>{fractionLabel}</Text>
          <Ionicons name="chevron-forward" size={15} color={palette.inkFaint} />
        </View>
      </View>

      <View
        style={{
          height: 5,
          backgroundColor: palette.creamDeep,
          borderRadius: 5,
          overflow: "hidden",
          marginTop: 10,
        }}
      >
        <View
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            height: 5,
            borderRadius: 5,
            backgroundColor: accentColor,
          }}
        />
      </View>
    </Pressable>
  );
}
