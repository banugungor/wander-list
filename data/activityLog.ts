import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CategoryId } from "@/constants/categories";
import { queueCloudSync } from "@/data/cloudSync";
import { ACTIVITY_LOG_KEY } from "@/data/storageKeys";

export { ACTIVITY_LOG_KEY };
const MAX_ENTRIES = 30;

export type ActivityEntry = {
  id: string;
  type: CategoryId;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  iso2?: string;
  timestamp: number;
};

export async function logActivity(
  entry: Omit<ActivityEntry, "timestamp">,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
    const current: ActivityEntry[] = raw ? JSON.parse(raw) : [];

    // avoid duplicate consecutive entries for the same item
    const withoutSame = current.filter(
      (e) => !(e.id === entry.id && e.type === entry.type),
    );

    const updated = [{ ...entry, timestamp: Date.now() }, ...withoutSame].slice(
      0,
      MAX_ENTRIES,
    );

    await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updated));
    queueCloudSync();
  } catch (e) {
    console.log("ACTIVITY LOG WRITE ERROR", e);
  }
}

export async function getActivityLog(): Promise<ActivityEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.log("ACTIVITY LOG READ ERROR", e);
    return [];
  }
}

export function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} hafta önce`;
  const months = Math.floor(days / 30);
  return `${months} ay önce`;
}
