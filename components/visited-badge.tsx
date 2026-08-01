import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export function VisitedBadge({
  checked,
  color = palette.greenText,
}: {
  checked: boolean;
  color?: string;
}) {
  if (!checked) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color,
        borderWidth: 2,
        borderColor: palette.cream,
      }}
    >
      <Ionicons name="checkmark" size={12} color={palette.surface} />
    </View>
  );
}
