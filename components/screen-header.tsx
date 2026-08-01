import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  accentBg?: string;
  accentFg?: string;
  right?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  accentBg = palette.greenSoft,
  accentFg = palette.greenText,
  right,
}: ScreenHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 60,
      }}
    >
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: accentBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="chevron-back" size={18} color={accentFg} />
      </Pressable>

      <View style={{ alignItems: "center", flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: palette.ink }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ marginTop: 2, fontSize: 12, color: palette.inkMuted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ?? <View style={{ width: 36, height: 36 }} />}
    </View>
  );
}
