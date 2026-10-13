import { SuggestionModal } from "@/components/suggestion-modal";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import type { SuggestionCategory } from "@/data/suggestions";
import { useSession } from "@/hooks/use-session";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

type SuggestionEntryProps = {
  category: SuggestionCategory;
  /** Fixed country (on a country's own screen), or omit to let the user
   * pick one in the form (on a category's first screen). */
  countryId?: string;
  /** Accent color of the category, for the icon. */
  accentColor?: string;
};

/** The "suggest something we're missing" card, plus the form it opens.
 * Used as a list footer / empty state on every country screen and on each
 * category's first screen, so the wording and sign-in rule stay in one
 * place. Suggestions need an account (spam guard + the daily cap is
 * per-user), so signed-out taps get a sign-in prompt instead. */
export function SuggestionEntry({
  category,
  countryId,
  accentColor = palette.brand,
}: SuggestionEntryProps) {
  const { t } = useLanguage();
  const { session } = useSession();
  const [open, setOpen] = useState(false);

  const handlePress = () => {
    if (session) {
      setOpen(true);
      return;
    }
    Alert.alert(t("suggest.signInTitle"), t("suggest.signInBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("suggest.signIn"), onPress: () => router.push("/auth") },
    ]);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginHorizontal: 16,
          marginTop: 16,
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: palette.hairlineStrong,
          backgroundColor: palette.surface,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="bulb-outline" size={24} color={accentColor} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: palette.ink }}>
            {t(`suggest.${category}.entryTitle`)}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 12, lineHeight: 17, color: palette.inkMuted }}>
            {t("suggest.entryBody")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={palette.inkFaint} />
      </Pressable>

      <SuggestionModal
        visible={open}
        category={category}
        countryId={countryId ?? null}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
