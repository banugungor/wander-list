import type { HeritageItem } from "@/data/heritageSites";
import {
  getHeritageImageMap,
  subscribeHeritageImages,
} from "@/data/heritageImages";
import { useSyncExternalStore } from "react";

/** The photo to show for a heritage site: the admin-panel photo from
 * Supabase (data/heritageImages.ts) if there is one, else an `imageUrl`
 * baked into the bundled JSON, else null (the caller shows a placeholder).
 * Re-renders when the photo map finishes loading. */
export function useHeritageImageUrl(item: HeritageItem): string | null {
  const map = useSyncExternalStore(
    subscribeHeritageImages,
    getHeritageImageMap,
    getHeritageImageMap,
  );
  return map[item.id] ?? item.imageUrl ?? null;
}
