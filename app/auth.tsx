import { CountryPickerModal } from "@/components/country-picker-modal";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { syncAfterAuth } from "@/data/cloudSync";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type SelectedCountry = { id: string; name: string };

export default function AuthScreen() {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState<SelectedCountry | null>(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t("auth.missingInfoTitle"), t("auth.missingInfoMessage"));
      return;
    }

    if (mode === "signUp" && !country) {
      Alert.alert(t("auth.missingCountryTitle"), t("auth.missingCountryMessage"));
      return;
    }

    setLoading(true);
    try {
      const { data, error } =
        mode === "signIn"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  first_name: firstName.trim(),
                  last_name: lastName.trim(),
                  country_id: country?.id,
                  country: country?.name,
                  city: city.trim(),
                },
              },
            });

      if (error) {
        Alert.alert(t("auth.errorTitle"), error.message);
        return;
      }

      // Email confirmation is enabled on this Supabase project: a fresh
      // sign-up returns a user but no session until the link is clicked.
      if (mode === "signUp" && !data.session) {
        Alert.alert(t("auth.confirmEmailTitle"), t("auth.confirmEmailMessage"));
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
        Alert.alert(t("auth.errorTitle"), t("auth.appleSignInFailed"));
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) {
        Alert.alert(t("auth.errorTitle"), error.message);
        return;
      }

      await syncAfterAuth();
      router.back();
    } catch (e: any) {
      if (e?.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert(t("auth.errorTitle"), t("auth.appleSignInFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: palette.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: palette.ink,
    marginTop: 10,
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen
        options={{
          title: mode === "signIn" ? t("auth.signIn") : t("auth.signUp"),
          headerShown: true,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
        {mode === "signUp" && (
          <>
            <TextInput
              placeholder={t("auth.firstName")}
              placeholderTextColor={palette.inkFaint}
              value={firstName}
              onChangeText={setFirstName}
              style={[inputStyle, { marginTop: 0 }]}
            />
            <TextInput
              placeholder={t("auth.lastName")}
              placeholderTextColor={palette.inkFaint}
              value={lastName}
              onChangeText={setLastName}
              style={inputStyle}
            />
          </>
        )}

        <TextInput
          placeholder={t("auth.email")}
          placeholderTextColor={palette.inkFaint}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={[inputStyle, mode === "signIn" && { marginTop: 0 }]}
        />

        <View style={{ position: "relative" }}>
          <TextInput
            placeholder={t("auth.password")}
            placeholderTextColor={palette.inkFaint}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={[inputStyle, { paddingRight: 44 }]}
          />
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={{
              position: "absolute",
              right: 14,
              top: 0,
              bottom: 0,
              justifyContent: "center",
              marginTop: 10,
            }}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={palette.inkMuted}
            />
          </Pressable>
        </View>

        {mode === "signUp" && (
          <>
            <Pressable
              onPress={() => setCountryPickerVisible(true)}
              style={[
                inputStyle,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: country ? palette.ink : palette.inkFaint,
                }}
              >
                {country
                  ? getLocalizedCountryName(country.name, language)
                  : t("auth.countryRequired")}
              </Text>
              <Text style={{ fontSize: 12, color: palette.inkMuted }}>
                {t("auth.country")}
              </Text>
            </Pressable>

            <TextInput
              placeholder={t("auth.city")}
              placeholderTextColor={palette.inkFaint}
              value={city}
              onChangeText={setCity}
              style={inputStyle}
            />
          </>
        )}

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
              {mode === "signIn" ? t("auth.signIn") : t("auth.signUp")}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
          style={{
            marginTop: 16,
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 14, color: palette.inkMuted }}>
            {mode === "signIn"
              ? t("auth.noAccountPrefix")
              : t("auth.hasAccountPrefix")}
          </Text>
          <Text style={{ fontSize: 14, color: palette.brand, fontWeight: "700" }}>
            {mode === "signIn" ? t("auth.signUp") : t("auth.signIn")}
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
      </ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        onSelect={(c) => setCountry({ id: c.id, name: c.name })}
      />
    </View>
  );
}
