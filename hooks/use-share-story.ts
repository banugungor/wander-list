import { useLanguage } from "@/contexts/language-context";
import { shareStatsToInstagramStory } from "@/data/shareStory";
import { useCallback, useRef, useState } from "react";
import { Alert, type View } from "react-native";

/**
 * Owns the capture-and-share flow for an off-screen share card: attach
 * `cardRef` to the card (rendered via `OffscreenShareCard`), call `share()`
 * to capture it and hand it to Instagram Stories / the OS share sheet.
 * Shared by the Stats tab and the Places screen so the error handling lives
 * in one place.
 */
export function useShareStory() {
  const { t } = useLanguage();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const share = useCallback(async () => {
    setSharing(true);
    try {
      await shareStatsToInstagramStory(cardRef);
    } catch (e) {
      console.log("SHARE STORY ERROR", e);
      Alert.alert(t("stats.shareErrorTitle"), t("stats.shareError"));
    } finally {
      setSharing(false);
    }
  }, [t]);

  return { cardRef, sharing, share };
}
