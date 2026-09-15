import { logActivity } from "@/data/activityLog";
import { maybePromptSignup } from "@/data/authPrompt";
import { queueCloudSync } from "@/data/cloudSync";
import { LANDMARKS_VISITED_KEY } from "@/data/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type LandmarkVisitInfo = {
  name: string;
  country: string;
  imageUrl?: string | null;
};

/** Flips a landmark's visited state, persists it, syncs to the cloud, and
 * logs an activity entry when it's freshly marked visited. */
export async function toggleLandmarkVisited(
  id: string,
  item: LandmarkVisitInfo | undefined,
  visited: string[],
): Promise<string[]> {
  const wasVisited = visited.includes(id);
  const updated = wasVisited
    ? visited.filter((v) => v !== id)
    : [...visited, id];

  await AsyncStorage.setItem(LANDMARKS_VISITED_KEY, JSON.stringify(updated));
  queueCloudSync();

  if (!wasVisited) {
    maybePromptSignup();
    if (item) {
      logActivity({
        id,
        type: "landmarks",
        title: item.name,
        subtitle: item.country,
        imageUrl: item.imageUrl,
      });
    }
  }

  return updated;
}
