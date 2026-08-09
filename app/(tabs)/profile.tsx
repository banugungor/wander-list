import { BottomTabBar } from "@/components/bottom-tab-bar";
import { palette } from "@/constants/palette";
import { ACTIVITY_LOG_KEY } from "@/data/activityLog";
// import { pushToCloud } from "@/data/cloudSync"; // cloud sync devre dışı
import {
  CUISINE_AREA_TOTALS_KEY,
  CUISINE_VISITED_KEY,
  HERITAGE_VISITED_KEY,
} from "@/data/heritageStorage";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
// import { supabase } from "@/lib/supabase"; // cloud sync devre dışı
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
// import { router } from "expo-router"; // cloud sync devre dışı
// import { useEffect, useState } from "react"; // cloud sync devre dışı
import { Alert, Pressable, Text, View } from "react-native";
// import type { Session } from "@supabase/supabase-js"; // cloud sync devre dışı

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
  // Cloud sync devre dışı — hesap/oturum durumu şimdilik kullanılmıyor.
  // Geri açmak için: yukarıdaki importları kaldır ve aşağıyı aç.
  // const [session, setSession] = useState<Session | null>(null);
  //
  // useEffect(() => {
  //   supabase.auth.getSession().then(({ data }) => setSession(data.session));
  //   const { data: listener } = supabase.auth.onAuthStateChange(
  //     (_event, newSession) => setSession(newSession),
  //   );
  //   return () => listener.subscription.unsubscribe();
  // }, []);

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
              PLACES_VISITED_KEY,
              ACTIVITY_LOG_KEY,
            ]);
            // if (session) {
            //   await pushToCloud();
            // }
            Alert.alert("Tamam", "Veriler sıfırlandı.");
          },
        },
      ],
    );
  };

  // const signOut = () => {
  //   Alert.alert("Çıkış yap", "Hesabından çıkış yapmak istiyor musun?", [
  //     { text: "Vazgeç", style: "cancel" },
  //     {
  //       text: "Çıkış yap",
  //       style: "destructive",
  //       onPress: () => supabase.auth.signOut(),
  //     },
  //   ]);
  // };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.cream,
        paddingHorizontal: 20,
        paddingTop: 64,
      }}
    >
      {/* Cloud sync devre dışı — hesap avatarı/e-posta bilgisi şimdilik gizli.
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
            {session?.user.email?.charAt(0).toUpperCase() ?? "?"}
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
          {session ? "Hesabım" : "Giriş yapılmadı"}
        </Text>
        <Text style={{ marginTop: 2, fontSize: 12, color: palette.inkMuted }}>
          {session?.user.email ?? "Verilerini yedeklemek için giriş yap"}
        </Text>
      </View>

      {session ? (
        <Row icon="log-out-outline" label="Çıkış yap" danger onPress={signOut} />
      ) : (
        <Row
          icon="log-in-outline"
          label="Giriş Yap / Kayıt Ol"
          onPress={() => router.push("/auth")}
        />
      )}
      */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: palette.ink,
          }}
        >
          Profil
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
