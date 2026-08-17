import { useLanguage } from "@/contexts/language-context";
import { Stack } from "expo-router";

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Stack screenOptions={{ animation: "slide_from_right" }}>
      <Stack.Screen
        name="index"
        options={{
          title: t("home.title"),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="explore"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="places-map"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="badges"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="stats"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
