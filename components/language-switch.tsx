import { palette } from "@/constants/palette";
import { useLanguage, type Language } from "@/contexts/language-context";
import { Pressable, Text, View } from "react-native";

const LANGUAGES: Language[] = ["tr", "en"];

/** compact: a small round button (fits the home screen header slot) that
 * cycles TR/EN on tap. Non-compact: a segmented control for settings-style
 * screens, matching the grid/list toggle style used on the places map. */
export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();

  if (compact) {
    return (
      <Pressable
        onPress={() => setLanguage(language === "tr" ? "en" : "tr")}
        hitSlop={8}
        style={({ pressed }) => [
          {
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: palette.creamDeep,
            alignItems: "center",
            justifyContent: "center",
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: palette.brand }}>
          {language.toUpperCase()}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: palette.creamDeep,
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {LANGUAGES.map((lang) => {
        const active = language === lang;
        return (
          <Pressable
            key={lang}
            onPress={() => setLanguage(lang)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 8,
              backgroundColor: active ? palette.surface : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: active ? palette.ink : palette.inkMuted,
              }}
            >
              {lang.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
