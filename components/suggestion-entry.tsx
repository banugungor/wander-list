import { SuggestionModal } from "@/components/suggestion-modal";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import type { HeritageItem } from "@/data/heritageSites";
import type { SuggestionCategory } from "@/data/suggestions";
import { useHeritageImageUrl } from "@/hooks/use-heritage-image-url";
import { useSession } from "@/hooks/use-session";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

/** Signed-out taps get this instead of the form: suggestions need an
 * account (spam guard + the daily cap is per-user). Shared by the cards below
 * and the per-row "add a photo" button (hooks/use-entry-photo-suggestion.tsx). */
export function promptSuggestionSignIn(t: (key: string) => string) {
  Alert.alert(t("suggest.signInTitle"), t("suggest.signInBody"), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("suggest.signIn"), onPress: () => router.push("/auth") },
  ]);
}

type SuggestionEntryProps = {
  category: SuggestionCategory;
  /** Fixed country (on a country's own screen), or omit to let the user
   * pick one in the form (on a category's first screen). */
  countryId?: string;
  /** `heritage_photo` only: the site the photo is for. */
  heritageSite?: { id: string; name: string };
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
  heritageSite,
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
    promptSuggestionSignIn(t);
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
            {t(category === "heritage_photo" ? "suggest.heritage_photo.entryBody" : "suggest.entryBody")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={palette.inkFaint} />
      </Pressable>

      <SuggestionModal
        visible={open}
        category={category}
        countryId={countryId ?? null}
        heritageSite={heritageSite}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

/** The "send a photo for this site" card for a heritage site's detail
 * screen. Heritage sites ship without photos (see CLAUDE.md), so it only
 * shows while the site has none. */
export function HeritagePhotoSuggestionEntry({
  item,
  accentColor,
}: {
  item: HeritageItem;
  accentColor?: string;
}) {
  const imageUrl = useHeritageImageUrl(item);
  if (imageUrl) return null;
  return (
    <SuggestionEntry
      category="heritage_photo"
      heritageSite={{ id: item.id, name: item.name }}
      accentColor={accentColor}
    />
  );
}
