import { logActivity } from "@/data/activityLog";
import { queueCloudSync } from "@/data/cloudSync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HERITAGE_VISITED_KEY } from "@/data/storageKeys";

export {
  HERITAGE_VISITED_KEY,
  CUISINE_VISITED_KEY,
  CUISINE_AREA_TOTALS_KEY,
  CUISINE_MEAL_AREAS_KEY,
} from "@/data/storageKeys";

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

  await AsyncStorage.setItem(HERITAGE_VISITED_KEY, JSON.stringify(updated));
  queueCloudSync();

  if (!wasVisited && item) {
    logActivity({
      id,
      type: "heritage",
      title: item.name,
      subtitle: item.country,
      imageUrl: item.imageUrl,
    });
  }

  return updated;
}
