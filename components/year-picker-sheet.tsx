import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

const OLDEST_LISTED_YEAR = 1980;

type Props = {
  visible: boolean;
  /** Shown in the title, e.g. "🇮🇹 Italy". */
  title: string;
  selectedYear: number | null;
  onPick: (year: number | null) => void;
  onClose: () => void;
};

/** Bottom sheet to pick the year a country was visited (or clear it). */
export function YearPickerSheet({
  visible,
  title,
  selectedYear,
  onPick,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const thisYear = new Date().getFullYear();
  const years = Array.from(
    { length: thisYear - OLDEST_LISTED_YEAR + 1 },
    (_, i) => thisYear - i,
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(30,27,24,0.4)",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            maxHeight: "65%",
            padding: 20,
            paddingBottom: 36,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            backgroundColor: palette.cream,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: palette.ink }}>
            {title}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 12, color: palette.inkMuted }}>
            {t("me.yearPickTitle")}
          </Text>
          <ScrollView style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {years.map((year) => {
                const active = year === selectedYear;
                return (
                  <Pressable
                    key={year}
                    onPress={() => onPick(year)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: active ? palette.brand : palette.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: active ? palette.surface : palette.ink,
                      }}
                    >
                      {year}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedYear !== null ? (
              <Pressable
                onPress={() => onPick(null)}
                style={{ marginTop: 14, padding: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: palette.danger }}>
                  {t("me.yearClear")}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
