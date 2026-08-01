import { BottomTabBar } from "@/components/bottom-tab-bar";
import { palette } from "@/constants/palette";
import { ACTIVITY_LOG_KEY } from "@/data/activityLog";
import {
  CUISINE_AREA_TOTALS_KEY,
  CUISINE_VISITED_KEY,
  HERITAGE_VISITED_KEY,
} from "@/data/heritageStorage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Alert, Pressable, Text, View } from "react-native";

const appVersion = Constants.expoConfig?.version ?? "1.0.0";

function Row({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: palette.surface,
          borderRadius: 14,
          marginBottom: 10,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={danger ? "#B5423C" : palette.inkMuted}
      />
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: danger ? "#B5423C" : palette.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const resetData = () => {
    Alert.alert(
      "Verileri sıfırla",
      "Tüm işaretlediğin yerler, yemekler ve aktivite geçmişi silinecek. Emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sıfırla",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              HERITAGE_VISITED_KEY,
              CUISINE_VISITED_KEY,
              CUISINE_AREA_TOTALS_KEY,
              ACTIVITY_LOG_KEY,
            ]);
            Alert.alert("Tamam", "Veriler sıfırlandı.");
          },
        },
      ],
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.cream,
        paddingHorizontal: 20,
        paddingTop: 64,
      }}
    >
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: palette.creamDeep,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: "700", color: palette.brand }}>
            B
          </Text>
        </View>
        <Text
          style={{
            marginTop: 12,
            fontSize: 17,
            fontWeight: "700",
            color: palette.ink,
          }}
        >
          Banu
        </Text>
        <Text style={{ marginTop: 2, fontSize: 12, color: palette.inkMuted }}>
          banu@ecommerc.io
        </Text>
      </View>

      <Row icon="information-circle-outline" label={`Sürüm ${appVersion}`} />
      <Row
        icon="refresh-outline"
        label="Verileri sıfırla"
        danger
        onPress={resetData}
      />

      <BottomTabBar />
    </View>
  );
}
