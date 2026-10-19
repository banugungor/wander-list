import { getCountryImageMap, subscribeCountryImages } from "@/data/countryImages";
import { useSyncExternalStore } from "react";

/** The cover photo for a country (data/countryImages.ts), or null when it has
 * none or `countryId` is null. Re-renders when the photo map finishes
 * loading. */
export function useCountryImageUrl(countryId: string | null): string | null {
  const map = useSyncExternalStore(
    subscribeCountryImages,
    getCountryImageMap,
    getCountryImageMap,
  );
  return countryId ? (map[countryId] ?? null) : null;
}
