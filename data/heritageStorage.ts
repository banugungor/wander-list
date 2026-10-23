import { logActivity } from "@/data/activityLog";
import { maybePromptSignup } from "@/data/authPrompt";
import { queueCloudSync } from "@/data/cloudSync";
import { getHeritageImageUrl } from "@/data/heritageImages";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HERITAGE_VISITED_KEY } from "@/data/storageKeys";

export { HERITAGE_VISITED_KEY } from "@/data/storageKeys";

export type HeritageVisitInfo = {
  name: string;
  country: string;
  imageUrl?: string | null;
};

/** Flips a heritage site's visited state, persists it, syncs to the cloud,
 * and logs an activity entry when it's freshly marked visited. Shared by the
 * explore list and the site detail screen so both stay in sync. */
export async function toggleHeritageVisited(
  id: string,
  item: HeritageVisitInfo | undefined,
  visited: string[],
): Promise<string[]> {
  const wasVisited = visited.includes(id);
  const updated = wasVisited
    ? visited.filter((v) => v !== id)
    : [...visited, id];

  // Before the write, so an in-flight cloud pull backs off (see queueCloudSync).
  queueCloudSync();
  await AsyncStorage.setItem(HERITAGE_VISITED_KEY, JSON.stringify(updated));

  if (!wasVisited) {
    maybePromptSignup();
    if (item) {
      logActivity({
        id,
        type: "heritage",
        title: item.name,
        subtitle: item.country,
        // Same precedence as the thumbnail (use-heritage-image-url.ts): the
        // admin-panel photo first, then one baked into the bundled JSON.
        imageUrl: getHeritageImageUrl(id) ?? item.imageUrl,
      });
    }
  }

  return updated;
}
