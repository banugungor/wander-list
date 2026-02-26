import { Stack } from "expo-router";

export default function TabLayout() {
  return (
    <Stack screenOptions={{ animation: "slide_from_right" }}>
      <Stack.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="explore"
        options={{
          title: "Detay",
          headerBackTitle: "Geri",
        }}
      />
    </Stack>
  );
}
