import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export function VisitedBadge({ checked }: { checked: boolean }) {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: checked ? 0 : 1.5,
        borderColor: palette.hairlineStrong,
        backgroundColor: checked ? palette.coral : palette.cream,
      }}
    >
      <Ionicons
        name={checked ? "checkmark" : "ellipse-outline"}
        size={15}
        color={checked ? palette.surface : palette.inkFaint}
      />
    </View>
  );
}
