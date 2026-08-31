import { isIslandsUnlocked } from "@/data/subscription";
import { Redirect, Slot, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** Guards every /islands route (index, continent picker, country detail)
 * against direct/deep-linked access — the entry points in category-tile.tsx,
 * app/modal.tsx and app/(tabs)/index.tsx each check isIslandsUnlocked()
 * before navigating here, but none of that stops a stale nav history entry
 * or a future call site that forgets the check from landing straight on
 * these screens. Re-checks on focus (not just mount) so returning here after
 * an entitlement lapses redirects instead of leaving the content visible. */
export default function IslandsLayout() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      isIslandsUnlocked().then((result) => {
        if (!cancelled) setUnlocked(result);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (unlocked === null) return null;
  if (!unlocked) return <Redirect href="/paywall" />;

  return <Slot />;
}
