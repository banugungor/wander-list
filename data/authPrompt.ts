import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "@/constants/translations";
import { APP_LANGUAGE_KEY } from "@/data/storageKeys";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { Alert } from "react-native";

const SIGNUP_PROMPT_SHOWN_KEY = "signup_prompt_shown";

/** Shown once, the first time a signed-out user marks anything as visited —
 * nudges them to create an account so the data isn't only on this device. */
export async function maybePromptSignup(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return;

  const alreadyShown = await AsyncStorage.getItem(SIGNUP_PROMPT_SHOWN_KEY);
  if (alreadyShown) return;
  await AsyncStorage.setItem(SIGNUP_PROMPT_SHOWN_KEY, "1");

  const storedLanguage = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
  const t = translations[storedLanguage === "en" ? "en" : "tr"].auth;

  Alert.alert(t.firstMarkTitle, t.firstMarkMessage, [
    { text: t.notNow, style: "cancel" },
    { text: t.signUp, onPress: () => router.push("/auth") },
  ]);
}
