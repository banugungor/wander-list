import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import {
  ALL_ACCESS_ENTITLEMENT_ID,
  ISLANDS_OFFERING_ID,
  presentPaywallForCategory,
} from "@/data/subscription";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

// Every paid category shares the same two membership products (monthly /
// yearly, both attached to ALL_ACCESS_ENTITLEMENT_ID) and the same
// RevenueCat Offering — there's no per-category offering/entitlement, so
// this one screen serves all of them, routing back to whichever category
// sent the viewer here.
const ROUTE_BY_CATEGORY: Record<string, string> = {
  islands: "/islands",
  landmarks: "/landmarks",
  trips: "/(tabs)/trips",
  profile: "/(tabs)/profile",
};

/** App-side entry point for every paid-category paywall: presents
 * RevenueCat's paywall UI (design/copy configured in the RevenueCat
 * dashboard's Paywalls tab, not here) immediately on mount, with no
 * intermediate app-drawn screen. On close — purchase, restore, or dismiss
 * without buying — routes back to the category that sent the viewer here
 * (via the `category` param, defaulting to "islands" for old links/history
 * entries with no param) if now unlocked, otherwise just unwinds back to
 * wherever the user came from. If no paywall could be shown at all, says so
 * in an alert before unwinding, rather than closing with no feedback. */
export default function PaywallScreen() {
  const { t } = useLanguage();
  const presented = useRef(false);
  const { category } = useLocalSearchParams<{ category?: string }>();
  const categoryId = category ?? "islands";

  useEffect(() => {
    if (presented.current) return;
    presented.current = true;

    (async () => {
      const { unlocked, failed } = await presentPaywallForCategory(
        ISLANDS_OFFERING_ID,
        ALL_ACCESS_ENTITLEMENT_ID,
      );
      if (unlocked) {
        router.replace((ROUTE_BY_CATEGORY[categoryId] ?? "/islands") as never);
      } else if (failed) {
        Alert.alert(t("paywall.unavailableTitle"), t("paywall.unavailableMessage"), [
          { text: t("common.ok"), onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
    })();
  }, [categoryId, t]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream, alignItems: "center", justifyContent: "center" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator color={palette.violetText} />
    </View>
  );
}
