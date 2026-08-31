import { logActivity } from "@/data/activityLog";
import { maybePromptSignup } from "@/data/authPrompt";
import { queueCloudSync } from "@/data/cloudSync";
import { ISLANDS_VISITED_KEY } from "@/data/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type IslandVisitInfo = {
  name: string;
  country: string;
  imageUrl?: string | null;
};

/** Flips an island's visited state, persists it, syncs to the cloud, and
 * logs an activity entry when it's freshly marked visited. */
export async function toggleIslandVisited(
  id: string,
  item: IslandVisitInfo | undefined,
  visited: string[],
): Promise<string[]> {
  const wasVisited = visited.includes(id);
  const updated = wasVisited
    ? visited.filter((v) => v !== id)
    : [...visited, id];

  await AsyncStorage.setItem(ISLANDS_VISITED_KEY, JSON.stringify(updated));
  queueCloudSync();

  if (!wasVisited) {
    maybePromptSignup();
    if (item) {
      logActivity({
        id,
        type: "islands",
        title: item.name,
        subtitle: item.country,
        imageUrl: item.imageUrl,
      });
    }
  }

  return updated;
}
