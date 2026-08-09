import type { Category } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

type CategoryTileProps = {
  category: Category;
  count: number;
  total: number;
  wide?: boolean;
  onPress: () => void;
};

export function CategoryTile({
  category,
  count,
  total,
  wide = false,
  onPress,
}: CategoryTileProps) {
  const Illustration = category.illustration;
  const percent =
    total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;

  const decoration = Illustration ? (
    <Illustration
      width={wide ? 76 : 96}
      height={wide ? 76 : 96}
      style={{
        position: "absolute",
        bottom: wide ? -18 : -10,
        right: wide ? -10 : -14,
      }}
    />
  ) : (
    <Image
      source={{ uri: category.image }}
      style={
        wide
          ? { position: "absolute", top: 0, bottom: 0, right: 0, width: "34%" }
          : {
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "62%",
              height: "70%",
            }
      }
      contentFit="cover"
      transition={200}
    />
  );

  const badge = (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.85)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={category.icon} size={17} color={category.fg} />
    </View>
  );

  const progressTrack = (
    <View
      style={{
        marginTop: 8,
        height: 3,
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.6)",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${percent}%`,
          height: 3,
          borderRadius: 3,
          backgroundColor: category.fg,
        }}
      />
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: wide ? "100%" : "47%",
          backgroundColor: category.bg,
          borderRadius: 16,
          padding: 14,
          overflow: "hidden",
          shadowColor: palette.shadow,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 1,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      {decoration}

      {wide ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {badge}
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: palette.ink }}
                numberOfLines={1}
              >
                {category.title}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 11, color: category.fg }}>
                {category.implemented ? `${count}/${total}` : "Yakında"}
              </Text>
            </View>
          </View>
          {progressTrack}
        </>
      ) : (
        <>
          {badge}
          <Text
            style={{
              marginTop: 10,
              fontSize: 13,
              fontWeight: "600",
              color: palette.ink,
            }}
            numberOfLines={1}
          >
            {category.title}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 11, color: category.fg }}>
            {category.implemented ? `${count}/${total}` : "Yakında"}
          </Text>
          {progressTrack}
        </>
      )}
    </Pressable>
  );
}
