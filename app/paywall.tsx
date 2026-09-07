import { palette } from "@/constants/palette";
import { presentIslandsPaywall } from "@/data/subscription";
import { Stack, router } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

/** App-side entry point for the Islands paywall: presents RevenueCat's
 * paywall UI (design/copy configured in the RevenueCat dashboard's Paywalls
 * tab, not here) immediately on mount, with no intermediate app-drawn
 * screen. On close — purchase, restore, or dismiss without buying — routes
 * to /islands if now unlocked, otherwise just unwinds back to wherever the
 * user came from. */
export default function PaywallScreen() {
  const presented = useRef(false);

  useEffect(() => {
    if (presented.current) return;
    presented.current = true;

    (async () => {
      const unlocked = await presentIslandsPaywall();
      if (unlocked) {
        router.replace("/islands");
      } else {
        router.back();
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream, alignItems: "center", justifyContent: "center" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator color={palette.violetText} />
    </View>
  );
}
