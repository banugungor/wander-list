import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

/** Search-box state for a screen that can be opened from a global search
 * result: starts as the `q` route param (the tapped item's name), so the item
 * is already filtered to when the screen appears, and is plain editable state
 * afterwards. */
export function useSearchParamState() {
  const { q } = useLocalSearchParams();
  return useState<string>(Array.isArray(q) ? (q[0] ?? "") : (q ?? ""));
}
