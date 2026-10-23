import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { LanguageProvider, useLanguage } from "@/contexts/language-context";
import { syncFromCloud } from "@/data/cloudSync";
import { loadCountryImages } from "@/data/countryImages";
import { loadHeritageImages } from "@/data/heritageImages";
import { loadHeritageSites } from "@/data/heritageSites";
import { configurePurchases } from "@/data/subscription";
import { hydrateVisitedHeritage } from "@/store/useAppStore";

// RevenueCat only needs a synchronous API-key registration at startup — it
// doesn't block the splash screen the way heritage decompression does.
configurePurchases();

export const unstable_settings = {
  anchor: "(tabs)",
};

// Keep the native splash up until the heritage dataset (see
// data/heritageSites.ts) has been decompressed into memory — every screen
// that reads `heritageSites` assumes it's already populated.
SplashScreen.preventAutoHideAsync().catch(() => {});

// How long the splash waits for the launch-time cloud pull. On a slow or absent
// connection the app opens from the on-device copy; the pull still finishes in
// the background and screens pick it up the next time they come into focus.
const LAUNCH_SYNC_TIMEOUT_MS = 3000;

function syncFromCloudWithTimeout(): Promise<void> {
  return Promise.race([
    syncFromCloud(),
    new Promise<void>((resolve) => setTimeout(resolve, LAUNCH_SYNC_TIMEOUT_MS)),
  ]);
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { t } = useLanguage();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: t("modal.headerTitle") }}
        />
        <Stack.Screen name="auth" options={{ presentation: "modal" }} />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [heritageReady, setHeritageReady] = useState(false);

  useEffect(() => {
    // The cloud copy has to land in AsyncStorage before the heritage store
    // reads it, hence the sequence inside the second entry.
    Promise.all([
      loadHeritageSites(),
      syncFromCloudWithTimeout().then(hydrateVisitedHeritage),
    ])
      .catch((error) => console.log("HERITAGE LOAD ERROR", error))
      .finally(() => setHeritageReady(true));
  }, []);

  // Admin-panel heritage + country photos: fire-and-forget, never gate the splash.
  useEffect(() => {
    loadHeritageImages();
    loadCountryImages();
  }, []);

  // Two phones on one account: pick up what the other one changed when this
  // one is opened again (see syncFromCloud in data/cloudSync.ts).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      // Every time the app comes to the front: syncFromCloud() runs one request
      // at a time and is a no-op when signed out.
      if (state === "active") syncFromCloud();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (heritageReady) SplashScreen.hideAsync();
  }, [heritageReady]);

  if (!heritageReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <RootLayoutNav />
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
