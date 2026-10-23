import { queueCloudSync } from "@/data/cloudSync";
import {
  type CountryYears,
  parseJsonSafe,
  sanitizeCountryYears,
} from "@/data/profileExtras";
import { COUNTRY_YEARS_KEY } from "@/data/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";

// The years the user says they visited a country (optional, set from the
// passport on the profile screen). Separate from the visited-id list so the
// toggle contract in placesStorage.ts stays unchanged.

export async function loadCountryYears(): Promise<CountryYears> {
  try {
    return sanitizeCountryYears(
      parseJsonSafe(await AsyncStorage.getItem(COUNTRY_YEARS_KEY)),
    );
  } catch (e) {
    console.log("COUNTRY YEARS READ ERROR", e);
    return {};
  }
}

async function writeYears(years: CountryYears): Promise<void> {
  await AsyncStorage.setItem(COUNTRY_YEARS_KEY, JSON.stringify(years));
}

/** Replaces a country's list of visit years (empty clears it) and returns the
 * new map. Callers pass the whole list, newest first. */
export async function setCountryYears(
  id: string,
  list: number[],
): Promise<CountryYears> {
  const years = await loadCountryYears();
  if (list.length === 0) delete years[id];
  else years[id] = list;
  queueCloudSync();
  try {
    await writeYears(years);
  } catch (e) {
    console.log("COUNTRY YEARS WRITE ERROR", e);
  }
  return years;
}

/** Drops a country's year when it is unmarked, so re-marking it later doesn't
 * resurrect a stale year. The caller already queues the cloud sync. */
export async function removeCountryYear(id: string): Promise<void> {
  try {
    const years = await loadCountryYears();
    if (!(id in years)) return;
    delete years[id];
    await writeYears(years);
  } catch (e) {
    console.log("COUNTRY YEARS REMOVE ERROR", e);
  }
}
