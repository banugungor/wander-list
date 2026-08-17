import { categories } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";

export default function AddScreen() {
  const { t } = useLanguage();

  const handlePress = (id: string, implemented: boolean) => {
    router.back();

    if (!implemented) {
      setTimeout(() => {
        Alert.alert(
          t("modal.comingSoonAlertTitle"),
          t("modal.comingSoonAlertMessage"),
        );
      }, 300);
      return;
    }

    if (id === "places") {
      router.push("/places-map");
      return;
    }

    router.push({ pathname: "/explore", params: { type: id } });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.cream,
        paddingHorizontal: 20,
        paddingTop: 24,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700", color: palette.ink }}>
        {t("modal.title")}
      </Text>
      <Text
        style={{
          marginTop: 4,
          marginBottom: 20,
          fontSize: 13,
          color: palette.inkMuted,
        }}
      >
        {t("modal.subtitle")}
      </Text>

      {categories.map((cat) => (
        <Pressable
          key={cat.id}
          onPress={() => handlePress(cat.id, cat.implemented)}
          style={({ pressed }) => [
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              backgroundColor: cat.bg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.6)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={cat.icon} size={20} color={cat.fg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: palette.ink }}
            >
              {t(cat.titleKey)}
            </Text>
            {!cat.implemented && (
              <Text style={{ marginTop: 2, fontSize: 11, color: cat.fg }}>
                {t("common.comingSoon")}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={cat.fg} />
        </Pressable>
      ))}
    </View>
  );
}
