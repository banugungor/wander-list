import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, usePathname } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabDef = {
  href: "/" | "/badges" | "/stats" | "/profile";
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const tabs: TabDef[] = [
  { href: "/", icon: "home-outline", activeIcon: "home" },
  { href: "/badges", icon: "ribbon-outline", activeIcon: "ribbon" },
];

const tabsRight: TabDef[] = [
  { href: "/stats", icon: "stats-chart-outline", activeIcon: "stats-chart" },
  { href: "/profile", icon: "person-outline", activeIcon: "person" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const renderTab = (tab: TabDef) => {
    const active = pathname === tab.href;
    return (
      <Pressable
        key={tab.href}
        onPress={() => {
          if (active) return;
          Haptics.selectionAsync();
          router.replace(tab.href as any);
        }}
        style={{ padding: 10 }}
      >
        <Ionicons
          name={active ? tab.activeIcon : tab.icon}
          size={22}
          color={active ? palette.brand : palette.inkFaint}
        />
      </Pressable>
    );
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingTop: 10,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        backgroundColor: palette.surface,
        borderTopWidth: 1,
        borderTopColor: palette.hairline,
        shadowColor: palette.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
        elevation: 4,
      }}
    >
      {tabs.map(renderTab)}

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/modal");
        }}
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          marginTop: -22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.brand,
          shadowColor: palette.brand,
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}
      >
        <Ionicons name="add" size={24} color={palette.surface} />
      </Pressable>

      {tabsRight.map(renderTab)}
    </View>
  );
}
