import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { View } from "react-native";

type ItemThumbnailProps = {
  imageUrl?: string | null;
  /** Shown on a tinted tile when the item has no photo. */
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  size?: number;
};

/** Rounded square photo of a dish/island/landmark, or an icon tile when it
 * has none. Shared by `EntryListRow` and the search-result rows. */
export function ItemThumbnail({
  imageUrl,
  icon,
  iconColor,
  size = 64,
}: ItemThumbnailProps) {
  const borderRadius = Math.round(size / 4);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
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
      <Ionicons name={icon} size={Math.round(size / 3)} color={iconColor} />
    </View>
  );
}
