import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "heritage_image_";
const NOT_FOUND_SENTINEL = "__none__";

/** Returns undefined if this site's image has never been resolved on this
 * device, null if it was resolved and no image exists, or the image URL. */
export async function getCachedHeritageImage(
  id: string,
): Promise<string | null | undefined> {
  const raw = await AsyncStorage.getItem(KEY_PREFIX + id);
  if (raw === null) return undefined;
  return raw === NOT_FOUND_SENTINEL ? null : raw;
}

export async function setCachedHeritageImage(
  id: string,
  imageUrl: string | null,
): Promise<void> {
  await AsyncStorage.setItem(
    KEY_PREFIX + id,
    imageUrl === null ? NOT_FOUND_SENTINEL : imageUrl,
  );
}
