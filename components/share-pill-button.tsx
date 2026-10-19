import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, type ViewStyle } from "react-native";

type SharePillButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
};

/** Small green "share" pill — used by the Stats tab and the Places screen. */
export function SharePillButton({
  label,
  onPress,
  loading = false,
  style,
}: SharePillButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: palette.greenSoft,
        },
        style,
        pressed && { opacity: 0.7 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.greenText} />
      ) : (
        <Ionicons name="share-social-outline" size={15} color={palette.greenText} />
      )}
      <Text style={{ fontSize: 12, fontWeight: "600", color: palette.greenText }}>
        {label}
      </Text>
    </Pressable>
  );
}
