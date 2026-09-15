import { isLandmarksUnlocked } from "@/data/subscription";
import { Redirect, Slot, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** Guards every /landmarks route (index, continent picker, city picker,
 * city detail) against direct/deep-linked access — mirrors
 * app/islands/_layout.tsx. Landmarks shares the same all-access
 * entitlement as Islands rather than having its own (see
 * data/subscription.ts) — there are only two membership products in this
 * app, not one per paid category. Re-checks on focus (not just mount) so
 * returning here after an entitlement lapses redirects instead of leaving
 * the content visible. */
export default function LandmarksLayout() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      isLandmarksUnlocked().then((result) => {
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
       * Stack's default native header never gets a chance to flash while
       * `unlocked` is still resolving. */}
      <Stack.Screen options={{ headerShown: false }} />
      {unlocked === null ? null : unlocked ? (
        <Slot />
      ) : (
        <Redirect href="/paywall?category=landmarks" />
      )}
    </>
  );
}
