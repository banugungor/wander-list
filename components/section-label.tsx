import { palette } from "@/constants/palette";
import { Text } from "react-native";
import type { ReactNode } from "react";

/** Small uppercase heading above a block on the profile screen. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        marginTop: 26,
        marginBottom: 14,
        fontSize: 11,
        fontWeight: "700",
        color: palette.inkMuted,
        letterSpacing: 0.6,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}
