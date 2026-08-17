import type { Category, CategoryId } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, Text, View } from "react-native";

const DECORATIONS: Partial<
  Record<
    CategoryId,
    {
      source: number;
      resizeMode: "cover" | "contain";
      heightScale?: number;
      topOffset?: number;
      rightOffset?: number;
    }
  >
> = {
  heritage: {
    source: require("../assets/decor/ephesus.png"),
    resizeMode: "cover",
  },
  places: {
    source: require("../assets/decor/countries.png"),
    resizeMode: "cover",
    heightScale: 1.1,
    topOffset: -25,
    rightOffset: 4,
  },
};

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
  const percent =
    total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
  const decoration = DECORATIONS[category.id];

  const badge = (
    <View
      style={{
        width: 50,
        height: 50,
        borderRadius: 28,
        backgroundColor: "rgba(255,255,255,0.92)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: palette.shadow,
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <Ionicons name={category.icon} size={24} color={category.fg} />
    </View>
  );

  const progressTrack = (
    <View
      style={{
        marginTop: 10,
        height: 6,
        borderRadius: 6,
        backgroundColor: "rgba(255,255,255,0.55)",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${percent}%`,
          height: 6,
          borderRadius: 6,
          backgroundColor: category.fg,
        }}
      />
    </View>
  );

  const baseDecorationTop = wide ? -6 : 70;
  const baseDecorationHeight = wide ? 118 : 100;
  const decorationTop = baseDecorationTop + (decoration?.topOffset ?? 0);
  const decorationHeight = baseDecorationHeight * (decoration?.heightScale ?? 1);
  const decorationRight = decoration?.rightOffset ?? 0;

  const decorationLayer = decoration && (
    <>
      <Image
        source={decoration.source}
        resizeMode={decoration.resizeMode}
        style={{
          position: "absolute",
          top: decorationTop,
          height: decorationHeight,
          right: decorationRight,
          width: wide ? "42%" : "90%",
        }}
      />
      <LinearGradient
        colors={[category.bg, `${category.bg}00`]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          position: "absolute",
          top: decorationTop,
          height: decorationHeight,
          left: 0,
          width: wide ? "48%" : "42%",
        }}
      />
    </>
  );

  const sheenLayer = (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -60,
          left: "8%",
          width: "22%",
          height: 260,
          backgroundColor: "rgba(255,255,255,0.16)",
          transform: [{ rotate: "25deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: -60,
          left: "48%",
          width: "13%",
          height: 260,
          backgroundColor: "rgba(255,255,255,0.1)",
          transform: [{ rotate: "25deg" }],
        }}
      />
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: "100%",
          borderRadius: 24,
          shadowColor: palette.shadow,
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 5 },
          elevation: 1,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <LinearGradient
        colors={[category.bg, category.bgTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 14,
          overflow: "hidden",
          minHeight: wide ? 102 : 156,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.5)",
        }}
      >
        {decorationLayer}
        {sheenLayer}

        {wide ? (
          <>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
            >
              {badge}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 19,
                    fontWeight: "700",
                    color: palette.ink,
                  }}
                  numberOfLines={1}
                >
                  {category.title}
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    fontWeight: "400",
                    color: category.fg,
                    opacity: category.implemented ? 1 : 0.6,
                  }}
                >
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
                fontSize: 16,
                fontWeight: "600",
                color: palette.ink,
              }}
              numberOfLines={1}
            >
              {category.title}
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: 14,
                fontWeight: "400",
                color: category.fg,
                opacity: category.implemented ? 1 : 0.6,
              }}
            >
              {category.implemented ? `${count}/${total}` : "Yakında"}
            </Text>
            {progressTrack}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}
