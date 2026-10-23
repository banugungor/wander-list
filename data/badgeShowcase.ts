import { queueCloudSync } from "@/data/cloudSync";
import {
  parseJsonSafe,
  sanitizeShowcase,
  SHOWCASE_SIZE,
} from "@/data/profileExtras";
import { BADGE_SHOWCASE_KEY } from "@/data/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function loadBadgeShowcase(): Promise<string[]> {
  try {
    return sanitizeShowcase(
      parseJsonSafe(await AsyncStorage.getItem(BADGE_SHOWCASE_KEY)),
    );
  } catch (e) {
    console.log("BADGE SHOWCASE READ ERROR", e);
    return [];
  }
}

export async function saveBadgeShowcase(ids: string[]): Promise<void> {
  queueCloudSync();
  try {
    await AsyncStorage.setItem(
      BADGE_SHOWCASE_KEY,
      JSON.stringify(ids.slice(0, SHOWCASE_SIZE)),
    );
  } catch (e) {
    console.log("BADGE SHOWCASE WRITE ERROR", e);
  }
}
