import { palette } from "@/constants/palette";
import { Text, View } from "react-native";

type ProgressCardProps = {
  label: string;
  detail: string;
  percent: number;
  accentBg?: string;
  accentFg?: string;
};

export function ProgressCard({
  label,
  detail,
  percent,
  accentBg = palette.greenSoft,
  accentFg = palette.brand,
}: ProgressCardProps) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        backgroundColor: accentBg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: accentFg,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>

        <Text style={{ fontSize: 12, color: palette.inkMuted }}>{detail}</Text>
      </View>

      <Text
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: "700",
          color: palette.ink,
          letterSpacing: -0.5,
        }}
      >
        {percent}%
      </Text>

      <View
        style={{
          height: 5,
          backgroundColor: "rgba(255,255,255,0.6)",
          borderRadius: 5,
          overflow: "hidden",
          marginTop: 10,
        }}
      >
        <View
          style={{
            width: `${percent}%`,
            height: 5,
            borderRadius: 5,
            backgroundColor: accentFg,
          }}
        />
      </View>
    </View>
  );
}
