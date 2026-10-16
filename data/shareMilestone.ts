import AsyncStorage from "@react-native-async-storage/async-storage";

// Visited-country counts at which the Places screen offers to share the map.
const SHARE_MILESTONES = [5, 20, 30, 50, 75];

// Highest milestone already offered on this device, so un-marking and
// re-marking a country (or reopening the screen) never asks twice.
const SHARE_MILESTONE_KEY = "share_milestone_prompted";

/** Returns `count` if it's a milestone not offered yet (and records it),
 * otherwise null. Call right after a country was freshly marked visited. */
export async function claimShareMilestone(count: number): Promise<number | null> {
  if (!SHARE_MILESTONES.includes(count)) return null;
  try {
    const raw = await AsyncStorage.getItem(SHARE_MILESTONE_KEY);
    const last = Number(raw);
    if (Number.isFinite(last) && last >= count) return null;
    await AsyncStorage.setItem(SHARE_MILESTONE_KEY, String(count));
    return count;
  } catch {
    return null;
  }
}
