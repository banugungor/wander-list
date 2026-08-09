import { palette } from "@/constants/palette";
import { syncAfterAuth } from "@/data/cloudSync";
import { supabase } from "@/lib/supabase";
import * as AppleAuthentication from "expo-apple-authentication";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AuthScreen() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Eksik bilgi", "Email ve şifre gerekli.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } =
        mode === "signIn"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (error) {
        Alert.alert("Hata", error.message);
        return;
      }

      // Email confirmation is enabled on this Supabase project: a fresh
      // sign-up returns a user but no session until the link is clicked.
      if (mode === "signUp" && !data.session) {
        Alert.alert(
          "E-postanı onayla",
          "Hesabını aktifleştirmek için email adresine gönderilen bağlantıya tıkla, sonra giriş yap.",
        );
        setMode("signIn");
        return;
      }

      await syncAfterAuth();
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert("Hata", "Apple girişi tamamlanamadı.");
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) {
        Alert.alert("Hata", error.message);
        return;
      }

      await syncAfterAuth();
      router.back();
    } catch (e: any) {
      if (e?.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Hata", "Apple girişi tamamlanamadı.");
      }
    } finally {
      setLoading(false);
    }
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
      <Stack.Screen
        options={{
          title: mode === "signIn" ? "Giriş Yap" : "Kayıt Ol",
          headerShown: true,
        }}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor={palette.inkFaint}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          backgroundColor: palette.surface,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 14,
          color: palette.ink,
          marginTop: 20,
        }}
      />

      <TextInput
        placeholder="Şifre"
        placeholderTextColor={palette.inkFaint}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          backgroundColor: palette.surface,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 14,
          color: palette.ink,
          marginTop: 10,
        }}
      />

      <Pressable
        onPress={handleEmailAuth}
        disabled={loading}
        style={({ pressed }) => [
          {
            backgroundColor: palette.brand,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 16,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={palette.surface} />
        ) : (
          <Text
            style={{ color: palette.surface, fontSize: 14, fontWeight: "700" }}
          >
            {mode === "signIn" ? "Giriş Yap" : "Kayıt Ol"}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
        style={{ marginTop: 16, alignItems: "center" }}
      >
        <Text style={{ fontSize: 13, color: palette.inkMuted }}>
          {mode === "signIn"
            ? "Hesabın yok mu? Kayıt ol"
            : "Zaten hesabın var mı? Giriş yap"}
        </Text>
      </Pressable>

      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={14}
          style={{ width: "100%", height: 48, marginTop: 24 }}
          onPress={handleAppleAuth}
        />
      )}
    </View>
  );
}
