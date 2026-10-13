import { palette } from "@/constants/palette";
import { useEffect, useState, type ReactNode } from "react";
import { Animated } from "react-native";

/** Full-screen layer shown on top of a form (inside the same Modal), with
 * a short fade-in. Pickers (country list, calendar) open as these instead of
 * as separate Modals: iOS can't present a second Modal while the first is
 * being dismissed, so swapping Modals meant closing the form, waiting, and
 * reopening it — which felt like the screen was breaking. Used by
 * trip-form-modal.tsx and suggestion-modal.tsx. */
export function ModalOverlay({ children }: { children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity,
        backgroundColor: palette.cream,
      }}
    >
      {children}
    </Animated.View>
  );
}
