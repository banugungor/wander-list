import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import {
  parseJsonSafe,
  sanitizeCountryYears,
  sanitizeShowcase,
} from "@/data/profileExtras";
import {
  ACTIVITY_LOG_KEY,
  BADGE_SHOWCASE_KEY,
  CLOUD_SYNC_DIRTY_KEY,
  COUNTRY_YEARS_KEY,
  CUISINE_VISITED_KEY,
  HERITAGE_VISITED_KEY,
  ISLANDS_VISITED_KEY,
  LANDMARKS_VISITED_KEY,
  PLACES_VISITED_KEY,
} from "@/data/storageKeys";
import { loginPurchases, logoutPurchases } from "@/data/subscription";
import { clearTripsCache } from "@/data/trips";
import { useAppStore } from "@/store/useAppStore";

const SYNCED_KEYS = [
  HERITAGE_VISITED_KEY,
  PLACES_VISITED_KEY,
  CUISINE_VISITED_KEY,
  ISLANDS_VISITED_KEY,
  LANDMARKS_VISITED_KEY,
  ACTIVITY_LOG_KEY,
  BADGE_SHOWCASE_KEY,
  COUNTRY_YEARS_KEY,
] as const;

function parseList(raw: string | null | undefined): unknown[] {
  const parsed = parseJsonSafe(raw);
  return Array.isArray(parsed) ? parsed : [];
}

// Bumped by every local write that queues a push. A push or pull remembers the
// value it started with, so one that finishes after a newer local edit never
// clears the "dirty" flag or overwrites that edit.
let localEditGeneration = 0;

async function readLocalBackup() {
  const entries = await AsyncStorage.multiGet(SYNCED_KEYS);
  const raw = Object.fromEntries(entries);
  return {
    heritage_visited: parseList(raw[HERITAGE_VISITED_KEY]),
    countries_visited: parseList(raw[PLACES_VISITED_KEY]),
    cuisine_visited: parseList(raw[CUISINE_VISITED_KEY]),
    islands_visited: parseList(raw[ISLANDS_VISITED_KEY]),
    landmarks_visited: parseList(raw[LANDMARKS_VISITED_KEY]),
    activity_log: parseList(raw[ACTIVITY_LOG_KEY]),
    profile_extras: {
      badge_showcase: sanitizeShowcase(parseJsonSafe(raw[BADGE_SHOWCASE_KEY])),
      country_years: sanitizeCountryYears(parseJsonSafe(raw[COUNTRY_YEARS_KEY])),
    },
  };
}

async function setDirty(dirty: boolean): Promise<void> {
  try {
    if (dirty) await AsyncStorage.setItem(CLOUD_SYNC_DIRTY_KEY, "1");
    else await AsyncStorage.removeItem(CLOUD_SYNC_DIRTY_KEY);
  } catch (e) {
    console.log("CLOUD SYNC DIRTY FLAG ERROR", e);
  }
}

async function isDirty(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLOUD_SYNC_DIRTY_KEY)) === "1";
  } catch {
    return false;
  }
}

/** Anything that isn't an array (a hand-edited row, a null column) reads as
 * empty instead of crashing the screens that `.includes()` on it. */
function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Country ids are the strings in worldCountries.json ("792"). A row edited by
 * hand in Supabase may hold numbers (792), which `includes("792")` never
 * matches — so the whole list would look unmarked. */
function asCountryIds(value: unknown): string[] {
  return asList(value)
    .filter((v) => typeof v === "string" || typeof v === "number")
    .map(String);
}

/** Uploads the device state. Resolves true only when Supabase accepted it —
 * supabase-js reports a rejected write in `error` instead of throwing, which
 * the old code never looked at. */
export async function pushToCloud(): Promise<boolean> {
  const generation = localEditGeneration;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const backup = await readLocalBackup();
    const row = {
      user_id: user.id,
      ...backup,
      updated_at: new Date().toISOString(),
    };
    let { error } = await supabase.from("user_backups").upsert(row);
    // `profile_extras` is a later column (scripts/user_backups_schema.sql);
    // if it hasn't been added yet, still back up the lists without it. Only
    // that error is retried — a network/RLS failure would just fail twice.
    if (error?.message?.includes("profile_extras")) {
      const { profile_extras: _omit, ...withoutExtras } = row;
      ({ error } = await supabase.from("user_backups").upsert(withoutExtras));
    }
    if (error) {
      console.log("CLOUD PUSH ERROR", error);
      return false;
    }
    if (generation === localEditGeneration) await setDirty(false);
    return true;
  } catch (e) {
    console.log("CLOUD PUSH ERROR", e);
    return false;
  }
}

/** The fields collected at sign-up (first_name, last_name, age_group,
 * gender, country_id) are stashed in auth.users' user_metadata at signUp
 * time, since that survives the email-confirmation gap before a session
 * exists. Once a session is available, materialize them into the
 * queryable `profiles` table (metadata itself can't be joined/aggregated
 * or searched). */
async function syncProfileFromMetadata(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const metadata = user.user_metadata ?? {};
  if (
    !metadata.first_name &&
    !metadata.last_name &&
    !metadata.age_group &&
    !metadata.gender &&
    !metadata.country_id
  )
    return;

  try {
    await supabase.from("profiles").upsert({
      user_id: user.id,
      first_name: metadata.first_name ?? null,
      last_name: metadata.last_name ?? null,
      age_group: metadata.age_group ?? null,
      gender: metadata.gender ?? null,
      home_country_id: metadata.country_id ?? null,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.log("PROFILE SYNC ERROR", e);
  }
}

/** "pulled": the cloud copy is now on the device. "empty": the cloud has no
 * backup row for this user yet. "skipped": nothing was written — signed out,
 * a network/RLS error, or the user edited something while the request was in
 * flight. Callers must never push the device state on "skipped": an empty
 * device (fresh install, cleared storage) would wipe a good cloud backup. */
type PullResult = "pulled" | "empty" | "skipped";

export async function pullFromCloud(): Promise<PullResult> {
  const generation = localEditGeneration;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "skipped";

    const { data, error } = await supabase
      .from("user_backups")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.log("CLOUD PULL ERROR", error);
      return "skipped";
    }
    if (!data) return "empty";
    if (generation !== localEditGeneration) return "skipped";

    const heritage = asList(data.heritage_visited);
    const entries: [string, string][] = [
      [HERITAGE_VISITED_KEY, JSON.stringify(heritage)],
      [PLACES_VISITED_KEY, JSON.stringify(asCountryIds(data.countries_visited))],
      [CUISINE_VISITED_KEY, JSON.stringify(asList(data.cuisine_visited))],
      [ISLANDS_VISITED_KEY, JSON.stringify(asList(data.islands_visited))],
      [LANDMARKS_VISITED_KEY, JSON.stringify(asList(data.landmarks_visited))],
      [ACTIVITY_LOG_KEY, JSON.stringify(asList(data.activity_log))],
    ];
    // Only the keys the cloud actually has: a row from before the column (or
    // the `{}` default) must not wipe this device's showcase / years. They go
    // into the same multiSet as the lists, so one native write applies it all.
    const extras = data.profile_extras;
    if (extras && typeof extras === "object" && !Array.isArray(extras)) {
      if (Array.isArray(extras.badge_showcase)) {
        entries.push([
          BADGE_SHOWCASE_KEY,
          JSON.stringify(sanitizeShowcase(extras.badge_showcase)),
        ]);
      }
      const years = extras.country_years;
      if (years && typeof years === "object" && !Array.isArray(years)) {
        entries.push([
          COUNTRY_YEARS_KEY,
          JSON.stringify(sanitizeCountryYears(years)),
        ]);
      }
    }
    await AsyncStorage.multiSet(entries);
    // heritage-visited state also lives in a zustand store (see
    // store/useAppStore.ts) that isn't re-read from AsyncStorage on its
    // own — push the pulled value in directly so the UI reflects it right
    // after sign-in instead of only after an app restart.
    useAppStore.getState().setVisitedHeritage(heritage as string[]);
    await setDirty(false);
    return "pulled";
  } catch (e) {
    console.log("CLOUD PULL ERROR", e);
    return "skipped";
  }
}

/** Cloud wins; a brand-new account (no row yet) is seeded from the device. */
async function pullOrSeed(): Promise<void> {
  const result = await pullFromCloud();
  if (result === "empty") await pushToCloud();
}

/** Called right after a successful sign-in/sign-up: restores existing cloud
 * data if there is any, otherwise seeds the cloud with what's on the device. */
export async function syncAfterAuth(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await loginPurchases(user.id);
  } catch (e) {
    console.log("REVENUECAT LOGIN ERROR", e);
  }

  await syncProfileFromMetadata();
  await pullOrSeed();
}

let syncInFlight: Promise<void> | null = null;

/** Brings an already signed-in device in line with the cloud — on app launch
 * and when the app returns to the foreground, so two phones on one account
 * show the same lists. AsyncStorage stays as the offline cache every screen
 * reads, but the cloud copy replaces it here. If the device has edits that
 * never reached the cloud (made offline, app killed inside the 1.5s debounce)
 * those are pushed instead of being overwritten. No-op when signed out. */
export function syncFromCloud(): Promise<void> {
  if (syncInFlight) return syncInFlight;
  syncInFlight = (async () => {
    try {
      // getSession reads the stored session, no network — a signed-out or
      // offline launch must not wait on a request just to find that out.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      if (await isDirty()) await pushToCloud();
      else await pullOrSeed();
    } catch (e) {
      console.log("CLOUD SYNC ERROR", e);
    } finally {
      syncInFlight = null;
    }
  })();
  return syncInFlight;
}

/** Permanently deletes the signed-in user's account: server-side row +
 * auth.users deletion via the `delete-account` Edge Function (needs the
 * service-role key, which never lives in this app — see
 * supabase/functions/delete-account/index.ts), then clears everything that
 * was theirs on this device. Throws if the function call fails, so the
 * caller can show an error instead of signing the user out of a
 * half-deleted account. */
export async function deleteAccount(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
  });
  if (error) throw error;

  // The server-side `trips` rows go with the auth user (on delete cascade);
  // this removes the offline copy on the device. `suggestions` rows are
  // deliberately kept (FK is `on delete set null` — the user agreed to that
  // when submitting, see scripts/suggestions_schema.sql).
  if (user) await clearTripsCache(user.id);
  logoutPurchases();
  await supabase.auth.signOut();
  await clearLocalAccountData();
}

/** Removes everything on this device that belongs to the signed-in account —
 * the synced lists, profile extras and the "unsynced edits" flag — so the next
 * account to sign in here starts from its own cloud copy and can never be
 * seeded with this one's data. */
async function clearLocalAccountData(): Promise<void> {
  // A pull that is still in flight must not write the old account's data back.
  localEditGeneration += 1;
  await AsyncStorage.multiRemove([...SYNCED_KEYS, CLOUD_SYNC_DIRTY_KEY]);
  useAppStore.getState().setVisitedHeritage([]);
}

/** Signs out and wipes this device's copy of the account's data. Edits that
 * haven't reached the cloud are uploaded first; if that fails (offline) it
 * returns false WITHOUT signing out, so nothing is lost — the caller tells the
 * user to reconnect and try again. */
export async function signOutAndClearLocal(): Promise<boolean> {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  if (await isDirty()) {
    const uploaded = await pushToCloud();
    if (!uploaded) return false;
  }
  await supabase.auth.signOut();
  await clearLocalAccountData();
  return true;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/** Debounces rapid successive local writes (e.g. toggling several sites in a
 * row) into a single cloud push. */
export function queueCloudSync(): void {
  // Call this BEFORE the AsyncStorage write it covers, not after: a pull that
  // is in flight checks the generation once and then writes, so bumping it
  // first is what makes that pull back off. The push is debounced, so it still
  // reads the finished write.
  localEditGeneration += 1;
  // Persisted (not just in memory) so an edit that is killed inside the
  // debounce window is still pushed, not overwritten, on the next launch.
  setDirty(true);
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(pushToCloud, 1500);
}
