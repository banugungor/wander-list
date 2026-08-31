import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { presentIslandsPaywall } from "@/data/subscription";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

/** Presents RevenueCat's paywall UI for the Islands yearly entitlement.
 * The actual offering/paywall layout is configured in the RevenueCat
 * dashboard (Paywalls tab), not here — this screen is just the app-side
 * entry point + the "locked" fallback UI shown while the sheet is loading
 * or if it can't be presented (e.g. SDK not configured). */
export default function PaywallScreen() {
  const { t } = useLanguage();

  const handleUnlock = async () => {
    const unlocked = await presentIslandsPaywall();
    if (unlocked) router.replace("/islands");
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: palette.violetPale,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Ionicons name="lock-closed" size={30} color={palette.violetText} />
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: palette.ink,
            textAlign: "center",
          }}
        >
          {t("paywall.title")}
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: palette.inkMuted,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          {t("paywall.body")}
        </Text>

        <Pressable
          onPress={handleUnlock}
          style={({ pressed }) => [
            {
              marginTop: 28,
              width: "100%",
              height: 52,
              borderRadius: 16,
              backgroundColor: palette.violetText,
              alignItems: "center",
              justifyContent: "center",
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: palette.surface }}>
            {t("paywall.unlockButton")}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }} hitSlop={8}>
          <Text style={{ fontSize: 14, color: palette.inkMuted }}>
            {t("common.cancel")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
