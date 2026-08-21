import { palette } from "@/constants/palette";
import { Pressable, Text, View } from "react-native";

type ChipOption = { value: string; label: string };

type ChipPickerProps = {
  label: string;
  options: ChipOption[];
  selected: string | null;
  onSelect: (value: string) => void;
};

export function ChipPicker({ label, options, selected, onSelect }: ChipPickerProps) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontSize: 12, color: palette.inkMuted, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? palette.brand : palette.surface,
                borderWidth: 1,
                borderColor: active ? palette.brand : palette.hairline,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? "700" : "400",
                  color: active ? palette.surface : palette.ink,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
