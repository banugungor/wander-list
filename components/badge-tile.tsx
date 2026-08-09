import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import type { Badge } from "@/data/badges";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function BadgeTile({ badge }: { badge: Badge }) {
  const category = getCategory(badge.categoryId);
  const bg = badge.earned ? category?.bg ?? palette.creamDeep : palette.creamDeep;
  const fg = badge.earned ? category?.fg ?? palette.inkFaint : palette.inkFaint;

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
          backgroundColor: badge.earned ? "rgba(255,255,255,0.7)" : palette.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={badge.earned ? category?.icon ?? "ribbon-outline" : "lock-closed-outline"}
          size={16}
          color={fg}
        />
      </View>
      <Text
        style={{
          marginTop: 10,
          fontSize: 14,
          fontWeight: "700",
          color: badge.earned ? palette.ink : palette.inkFaint,
        }}
      >
        {badge.title}
      </Text>
      <Text style={{ marginTop: 2, fontSize: 12, color: fg }}>
        {Math.min(badge.current, badge.target)}/{badge.target}
      </Text>
    </View>
  );
}
