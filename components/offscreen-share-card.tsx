import type { ReactNode } from "react";
import { View } from "react-native";

/** Keeps a share card mounted (so its ref is always ready to capture) but
 * out of sight — positioned off-screen rather than unmounted. */
export function OffscreenShareCard({ children }: { children: ReactNode }) {
  return (
    <View
      style={{ position: "absolute", top: 0, left: -9999 }}
      pointerEvents="none"
    >
      {children}
    </View>
  );
}
