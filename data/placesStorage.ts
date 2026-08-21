import { logActivity } from "@/data/activityLog";
import { maybePromptSignup } from "@/data/authPrompt";
import { queueCloudSync } from "@/data/cloudSync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PLACES_VISITED_KEY } from "@/data/storageKeys";

export { PLACES_VISITED_KEY } from "@/data/storageKeys";

export type PlaceVisitInfo = {
  name: string;
  iso2?: string;
};

/** Flips a country's visited state, persists it, syncs to the cloud, and
 * logs an activity entry when it's freshly marked visited. Shared by the
 * places map screen and the home screen's recent-activity cards. */
export async function togglePlaceVisited(
  id: string,
  item: PlaceVisitInfo | undefined,
  visited: string[],
): Promise<string[]> {
  const wasVisited = visited.includes(id);
  const updated = wasVisited
    ? visited.filter((v) => v !== id)
    : [...visited, id];

  await AsyncStorage.setItem(PLACES_VISITED_KEY, JSON.stringify(updated));
  queueCloudSync();

  if (!wasVisited) {
    maybePromptSignup();
    if (item) {
      logActivity({
        id,
        type: "places",
        title: item.name,
        iso2: item.iso2,
      });
    }
  }

  return updated;
}
