import { BottomTabBar } from "@/components/bottom-tab-bar";
import { LanguageSwitch } from "@/components/language-switch";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { ACTIVITY_LOG_KEY } from "@/data/activityLog";
import { pushToCloud } from "@/data/cloudSync";
import { HERITAGE_VISITED_KEY } from "@/data/heritageStorage";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import { CUISINE_AREA_TOTALS_KEY, CUISINE_VISITED_KEY } from "@/data/storageKeys";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import type { Session } from "@supabase/supabase-js";

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
  const { t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const resetData = () => {
    Alert.alert(
      t("profile.resetConfirmTitle"),
      t("profile.resetConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.resetConfirmAction"),
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              HERITAGE_VISITED_KEY,
              CUISINE_VISITED_KEY,
              CUISINE_AREA_TOTALS_KEY,
              PLACES_VISITED_KEY,
              ACTIVITY_LOG_KEY,
            ]);
            if (session) {
              await pushToCloud();
            }
            Alert.alert(t("profile.resetDoneTitle"), t("profile.resetDoneMessage"));
          },
        },
      ],
    );
  };

  const signOut = () => {
    Alert.alert(
      t("auth.signOutConfirmTitle"),
      t("auth.signOutConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("auth.signOutAction"),
          style: "destructive",
          onPress: () => supabase.auth.signOut(),
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
          {session ? t("profile.account") : t("profile.notSignedIn")}
        </Text>
        <Text style={{ marginTop: 2, fontSize: 12, color: palette.inkMuted }}>
          {session?.user.email ?? t("profile.emailBackupHint")}
        </Text>
      </View>

      {session ? (
        <Row
          icon="log-out-outline"
          label={t("auth.signOutAction")}
          danger
          onPress={signOut}
        />
      ) : (
        <Row
          icon="log-in-outline"
          label={t("profile.signInCta")}
          onPress={() => router.push("/auth")}
        />
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: palette.surface,
          borderRadius: 14,
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons name="language-outline" size={18} color={palette.inkMuted} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: palette.ink }}>
            {t("profile.language")}
          </Text>
        </View>
        <LanguageSwitch />
      </View>

      <Row icon="information-circle-outline" label={t("profile.version", { version: appVersion })} />
      <Row
        icon="refresh-outline"
        label={t("profile.resetData")}
        danger
        onPress={resetData}
      />

      <BottomTabBar />
    </View>
  );
}
