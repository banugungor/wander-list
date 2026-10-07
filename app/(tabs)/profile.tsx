import { BottomTabBar } from "@/components/bottom-tab-bar";
import { LanguageSwitch } from "@/components/language-switch";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { ACTIVITY_LOG_KEY } from "@/data/activityLog";
import { deleteAccount, pushToCloud } from "@/data/cloudSync";
import { clearTripsCache } from "@/data/trips";
import { useSession } from "@/hooks/use-session";
import { HERITAGE_VISITED_KEY } from "@/data/heritageStorage";
import { PLACES_VISITED_KEY } from "@/data/placesStorage";
import { CUISINE_AREA_TOTALS_KEY, CUISINE_VISITED_KEY, ISLANDS_VISITED_KEY } from "@/data/storageKeys";
import { ALL_ACCESS_ENTITLEMENT_ID, isCategoryUnlocked, logoutPurchases } from "@/data/subscription";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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

function ProMembershipCard({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: palette.surface,
          borderRadius: 14,
          marginBottom: 10,
        },
        pressed && onPress && { opacity: 0.8 },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: palette.amberPale,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesome6 name="crown" size={18} color={palette.amberText} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: palette.ink }}>
          {title}
        </Text>
        <Text style={{ marginTop: 2, fontSize: 12, color: palette.inkMuted }}>
          {subtitle}
        </Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { session } = useSession();
  const [proUnlocked, setProUnlocked] = useState(false);

  useEffect(() => {
    isCategoryUnlocked(ALL_ACCESS_ENTITLEMENT_ID).then(setProUnlocked);
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
              ISLANDS_VISITED_KEY,
              ACTIVITY_LOG_KEY,
            ]);
            useAppStore.getState().setVisitedHeritage([]);
            if (session) {
              await pushToCloud();
            }
            Alert.alert(t("profile.resetDoneTitle"), t("profile.resetDoneMessage"));
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("profile.deleteAccountConfirmTitle"),
      t("profile.deleteAccountConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.deleteAccountConfirmAction"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert(t("profile.deleteAccountDoneTitle"), t("profile.deleteAccountDoneMessage"));
            } catch (e) {
              console.log("DELETE ACCOUNT ERROR", e);
              Alert.alert(t("profile.deleteAccountErrorTitle"), t("profile.deleteAccountErrorMessage"));
            }
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
          onPress: () => {
            logoutPurchases();
            if (session) clearTripsCache(session.user.id);
            supabase.auth.signOut();
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

      {proUnlocked ? (
        <ProMembershipCard
          title={t("profile.proMember")}
          subtitle={t("profile.proMemberSubtitle")}
        />
      ) : (
        <ProMembershipCard
          title={t("profile.proMembership")}
          subtitle={t("profile.proMembershipSubtitle")}
          onPress={() => router.push({ pathname: "/paywall", params: { category: "profile" } })}
        />
      )}

      {!session && (
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
      {session && (
        <Row
          icon="trash-outline"
          label={t("profile.deleteAccount")}
          danger
          onPress={handleDeleteAccount}
        />
      )}
      {session && (
        <Row
          icon="log-out-outline"
          label={t("auth.signOutAction")}
          danger
          onPress={signOut}
        />
      )}

      <BottomTabBar />
    </View>
  );
}
