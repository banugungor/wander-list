import { ChipPicker } from "@/components/chip-picker";
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
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type SelectedCountry = { id: string; name: string };
// "forgot" = ask for email, "reset" = enter the emailed code + new password.
type AuthMode = "signIn" | "signUp" | "forgot" | "reset";

const AGE_GROUPS = ["13-17", "18-24", "25-34", "35-44", "45-54", "55+"];
const GENDERS = ["female", "male", "other"] as const;
const PRIVACY_POLICY_URL = "https://wanderlist-legal.netlify.app/privacy-policy.html";

export default function AuthScreen() {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState<SelectedCountry | null>(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
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

    if (mode === "signUp" && (!firstName.trim() || !lastName.trim())) {
      Alert.alert(t("auth.missingNameTitle"), t("auth.missingNameMessage"));
      return;
    }

    if (mode === "signUp" && !country) {
      Alert.alert(t("auth.missingCountryTitle"), t("auth.missingCountryMessage"));
      return;
    }

    if (mode === "signUp" && !privacyAccepted) {
      Alert.alert(t("auth.missingPrivacyTitle"), t("auth.missingPrivacyMessage"));
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
                  age_group: ageGroup,
                  gender: gender,
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

  // Sends the recovery email (it carries a 6-digit code, see the Supabase
  // "Reset Password" template). Always moves to the code step: Supabase doesn't
  // reveal whether the address has an account.
  const handleSendResetCode = async () => {
    if (!email.trim()) {
      Alert.alert(t("auth.missingInfoTitle"), t("auth.missingEmailMessage"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        Alert.alert(t("auth.errorTitle"), error.message);
        return;
      }
      setMode("reset");
      Alert.alert(t("auth.codeSentTitle"), t("auth.codeSentMessage"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim() || !password) {
      Alert.alert(t("auth.missingInfoTitle"), t("auth.missingResetInfoMessage"));
      return;
    }

    setLoading(true);
    try {
      // Verifying the recovery code signs the user in; updateUser then sets
      // the new password on that session.
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: resetCode.trim(),
        type: "recovery",
      });
      if (verifyError) {
        Alert.alert(t("auth.errorTitle"), verifyError.message);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        Alert.alert(t("auth.errorTitle"), updateError.message);
        return;
      }

      await syncAfterAuth();
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setResetCode("");
    if (next === "forgot" || next === "reset") setPassword("");
  };

  const primaryAction =
    mode === "forgot"
      ? handleSendResetCode
      : mode === "reset"
        ? handleResetPassword
        : handleEmailAuth;

  const primaryLabel = {
    signIn: t("auth.signIn"),
    signUp: t("auth.signUp"),
    forgot: t("auth.sendCode"),
    reset: t("auth.resetAction"),
  }[mode];

  const headerTitle = {
    signIn: t("auth.signIn"),
    signUp: t("auth.signUp"),
    forgot: t("auth.forgotTitle"),
    reset: t("auth.resetTitle"),
  }[mode];

  const isRecoveryMode = mode === "forgot" || mode === "reset";

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
          title: headerTitle,
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

        {isRecoveryMode && (
          <Text style={{ fontSize: 14, color: palette.inkMuted, marginBottom: 12 }}>
            {mode === "forgot"
              ? t("auth.forgotInstructions")
              : t("auth.resetInstructions")}
          </Text>
        )}

        <TextInput
          placeholder={t("auth.email")}
          placeholderTextColor={palette.inkFaint}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={mode !== "reset"}
          style={[
            inputStyle,
            mode !== "signUp" && { marginTop: 0 },
            mode === "reset" && { opacity: 0.6 },
          ]}
        />

        {mode === "reset" && (
          <TextInput
            placeholder={t("auth.code")}
            placeholderTextColor={palette.inkFaint}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoComplete="one-time-code"
            value={resetCode}
            onChangeText={setResetCode}
            style={inputStyle}
          />
        )}

        {mode !== "forgot" && (
        <View style={{ position: "relative" }}>
          <TextInput
            placeholder={mode === "reset" ? t("auth.newPassword") : t("auth.password")}
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
        )}

        {mode === "signIn" && (
          <Pressable
            onPress={() => switchMode("forgot")}
            style={{ alignSelf: "flex-end", marginTop: 12 }}
          >
            <Text style={{ fontSize: 13, color: palette.brand, fontWeight: "600" }}>
              {t("auth.forgotPassword")}
            </Text>
          </Pressable>
        )}

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

            <ChipPicker
              label={t("auth.ageGroup")}
              options={AGE_GROUPS.map((value) => ({ value, label: value }))}
              selected={ageGroup}
              onSelect={(value) => setAgeGroup(value === ageGroup ? null : value)}
            />

            <ChipPicker
              label={t("auth.gender")}
              options={GENDERS.map((value) => ({
                value,
                label: t(`auth.genderOptions.${value}`),
              }))}
              selected={gender}
              onSelect={(value) => setGender(value === gender ? null : value)}
            />

            <Pressable
              onPress={() => setPrivacyAccepted((prev) => !prev)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 16,
                gap: 10,
              }}
            >
              <Ionicons
                name={privacyAccepted ? "checkbox" : "square-outline"}
                size={20}
                color={privacyAccepted ? palette.brand : palette.inkMuted}
              />
              <Text style={{ flex: 1, fontSize: 13, color: palette.inkMuted }}>
                <Text
                  style={{ color: palette.brand, fontWeight: "700" }}
                  onPress={(e) => {
                    e.stopPropagation();
                    Linking.openURL(PRIVACY_POLICY_URL);
                  }}
                >
                  {t("auth.privacyLinkText")}
                </Text>
                {" " + t("auth.privacySuffix")}
              </Text>
            </Pressable>
          </>
        )}

        <Pressable
          onPress={primaryAction}
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
              {primaryLabel}
            </Text>
          )}
        </Pressable>

        {mode === "reset" && (
          <Pressable
            onPress={handleSendResetCode}
            disabled={loading}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, color: palette.brand, fontWeight: "700" }}>
              {t("auth.resendCode")}
            </Text>
          </Pressable>
        )}

        {isRecoveryMode ? (
          <Pressable
            onPress={() => switchMode("signIn")}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, color: palette.inkMuted }}>
              {t("auth.backToSignIn")}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => switchMode(mode === "signIn" ? "signUp" : "signIn")}
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
        )}

        {appleAvailable && !isRecoveryMode && (
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
