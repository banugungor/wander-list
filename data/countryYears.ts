import { queueCloudSync } from "@/data/cloudSync";
import {
  type CountryYears,
  parseJsonSafe,
  sanitizeCountryYears,
} from "@/data/profileExtras";
import { COUNTRY_YEARS_KEY } from "@/data/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";

// The year the user says they visited a country (optional, set from the
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

/** Sets (or, with `null`, clears) a country's year and returns the new map. */
export async function setCountryYear(
  id: string,
  year: number | null,
): Promise<CountryYears> {
  const years = await loadCountryYears();
  if (year === null) delete years[id];
  else years[id] = year;
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
