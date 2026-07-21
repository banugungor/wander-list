import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

type ProgressCardProps = {
  label: string;
  detail: string;
  percent: number;
  icon: keyof typeof Ionicons.glyphMap;
};

export function ProgressCard({ label, detail, percent, icon }: ProgressCardProps) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        padding: 18,
        borderRadius: 22,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.hairline,
        shadowColor: palette.shadow,
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              backgroundColor: palette.creamDeep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={icon} size={14} color={palette.violet} />
          </View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: palette.violet,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Text>
        </View>

        <Text style={{ fontSize: 12, color: palette.inkMuted }}>{detail}</Text>
      </View>

      <Text
        style={{
          marginTop: 10,
          fontSize: 34,
          fontWeight: "800",
          color: palette.ink,
          letterSpacing: -0.5,
        }}
      >
        {percent}%
      </Text>

      <View
        style={{
          height: 8,
          backgroundColor: palette.creamDeep,
          borderRadius: 8,
          overflow: "hidden",
          marginTop: 12,
        }}
      >
        <LinearGradient
          colors={[palette.coral, palette.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${percent}%`, height: 8, borderRadius: 8 }}
        />
      </View>
    </View>
  );
}
