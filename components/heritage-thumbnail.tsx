import { palette } from "@/constants/palette";
import type { HeritageItem } from "@/data/heritageSites";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { View } from "react-native";

export function HeritageThumbnail({
  item,
  size = 76,
}: {
  item: HeritageItem;
  size?: number;
}) {
  const borderRadius = size >= 200 ? 20 : 18;

  if (item.imageUrl) {
    return (
      <Image
        source={{ uri: item.imageUrl }}
        style={{ width: size, height: size, borderRadius }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: palette.creamDeep,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name="business-outline"
        size={size >= 200 ? 48 : 24}
        color={palette.violet}
      />
    </View>
  );
}
