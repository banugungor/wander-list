import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import {
  ACTIVITY_LOG_KEY,
  CUISINE_VISITED_KEY,
  HERITAGE_VISITED_KEY,
  PLACES_VISITED_KEY,
} from "@/data/storageKeys";
import { useAppStore } from "@/store/useAppStore";

const SYNCED_KEYS = [
  HERITAGE_VISITED_KEY,
  PLACES_VISITED_KEY,
  CUISINE_VISITED_KEY,
  ACTIVITY_LOG_KEY,
] as const;

async function readLocalBackup() {
  const entries = await AsyncStorage.multiGet(SYNCED_KEYS);
  const raw = Object.fromEntries(entries);
  return {
    heritage_visited: JSON.parse(raw[HERITAGE_VISITED_KEY] ?? "[]"),
    countries_visited: JSON.parse(raw[PLACES_VISITED_KEY] ?? "[]"),
    cuisine_visited: JSON.parse(raw[CUISINE_VISITED_KEY] ?? "[]"),
    activity_log: JSON.parse(raw[ACTIVITY_LOG_KEY] ?? "[]"),
  };
}

export async function pushToCloud(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const backup = await readLocalBackup();

  try {
    await supabase.from("user_backups").upsert({
      user_id: user.id,
      ...backup,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.log("CLOUD PUSH ERROR", e);
  }
}

/** The demographic fields collected at sign-up (age_group, gender,
 * country_id) are stashed in auth.users' user_metadata at signUp time,
 * since that survives the email-confirmation gap before a session exists.
 * Once a session is available, materialize them into the queryable
 * `profiles` table (metadata itself can't be joined/aggregated). */
async function syncProfileFromMetadata(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const metadata = user.user_metadata ?? {};
  if (!metadata.age_group && !metadata.gender && !metadata.country_id) return;

  try {
    await supabase.from("profiles").upsert({
      user_id: user.id,
      age_group: metadata.age_group ?? null,
      gender: metadata.gender ?? null,
      home_country_id: metadata.country_id ?? null,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.log("PROFILE SYNC ERROR", e);
  }
}

export async function pullFromCloud(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    const { data, error } = await supabase
      .from("user_backups")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return false;

    await AsyncStorage.multiSet([
      [HERITAGE_VISITED_KEY, JSON.stringify(data.heritage_visited ?? [])],
      [PLACES_VISITED_KEY, JSON.stringify(data.countries_visited ?? [])],
      [CUISINE_VISITED_KEY, JSON.stringify(data.cuisine_visited ?? [])],
      [ACTIVITY_LOG_KEY, JSON.stringify(data.activity_log ?? [])],
    ]);
    // heritage-visited state also lives in a zustand store (see
    // store/useAppStore.ts) that isn't re-read from AsyncStorage on its
    // own — push the pulled value in directly so the UI reflects it right
    // after sign-in instead of only after an app restart.
    useAppStore.getState().setVisitedHeritage(data.heritage_visited ?? []);
    return true;
  } catch (e) {
    console.log("CLOUD PULL ERROR", e);
    return false;
  }
}

/** Called right after a successful sign-in/sign-up: restores existing cloud
 * data if there is any, otherwise seeds the cloud with what's on the device. */
export async function syncAfterAuth(): Promise<void> {
  await syncProfileFromMetadata();
  const pulled = await pullFromCloud();
  if (!pulled) {
    await pushToCloud();
  }
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/** Debounces rapid successive local writes (e.g. toggling several sites in a
 * row) into a single cloud push. */
export function queueCloudSync(): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(pushToCloud, 1500);
}
