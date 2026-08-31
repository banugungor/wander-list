import { isIslandsUnlocked } from "@/data/subscription";
import { Redirect, Slot, Stack, useFocusEffect } from "expo-router";
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

  return (
    <>
      {/* Set unconditionally (not just by each child screen) so the root
       * Stack's default native header — and its back button, labeled after
       * the previous, title-less "(tabs)" route — never gets a chance to
       * flash while `unlocked` is still resolving. */}
      <Stack.Screen options={{ headerShown: false }} />
      {unlocked === null ? null : unlocked ? <Slot /> : <Redirect href="/paywall" />}
    </>
  );
}
