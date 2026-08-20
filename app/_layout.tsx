import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { LanguageProvider, useLanguage } from "@/contexts/language-context";
import { loadHeritageSites } from "@/data/heritageSites";
import { hydrateVisitedHeritage } from "@/store/useAppStore";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Keep the native splash up until the heritage dataset (see
// data/heritageSites.ts) has been decompressed into memory — every screen
// that reads `heritageSites` assumes it's already populated.
SplashScreen.preventAutoHideAsync().catch(() => {});

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
    Promise.all([loadHeritageSites(), hydrateVisitedHeritage()])
      .catch((error) => console.log("HERITAGE LOAD ERROR", error))
      .finally(() => setHeritageReady(true));
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
