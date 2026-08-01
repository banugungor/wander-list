import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type StatCardProps = {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
};

export function StatCard({ label, value, icon, bg, fg }: StatCardProps) {
  return (
    <View
      style={{
        width: "47%",
        backgroundColor: bg,
        borderRadius: 16,
        padding: 14,
        shadowColor: palette.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 11,
          backgroundColor: "rgba(255,255,255,0.7)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={16} color={fg} />
      </View>
      <Text
        style={{
          marginTop: 10,
          fontSize: 24,
          fontWeight: "700",
          color: palette.ink,
        }}
      >
        {value}
      </Text>
      <Text style={{ marginTop: 2, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}
