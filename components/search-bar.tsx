import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View, type StyleProp, type ViewStyle } from "react-native";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Overrides the default outer margins (16 sides, 16 top). */
  style?: StyleProp<ViewStyle>;
};

/** Rounded search field with a leading magnifier and a clear button. Shared
 * by every list/picker screen so they all look and behave the same. */
export function SearchBar({ value, onChangeText, placeholder, style }: SearchBarProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 16,
          marginTop: 16,
          paddingHorizontal: 14,
          height: 44,
          borderRadius: 12,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.hairline,
        },
        style,
      ]}
    >
      <Ionicons name="search-outline" size={18} color={palette.inkFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.inkFaint}
        style={{ flex: 1, marginLeft: 8, fontSize: 15, color: palette.ink }}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={18} color={palette.inkFaint} />
        </Pressable>
      )}
    </View>
  );
}
