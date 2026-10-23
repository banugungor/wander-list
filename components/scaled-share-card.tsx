import {
  SHARE_STORY_CARD_HEIGHT,
  SHARE_STORY_CARD_WIDTH,
} from "@/components/share-story-card";
import type { ReactNode } from "react";
import { View } from "react-native";

/** Shows a 9:16 share card shrunk down as a preview. The card itself is scaled
 * (not re-laid out), which keeps the preview identical to what gets shared. */
export function ScaledShareCard({
  scale,
  children,
}: {
  scale: number;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        width: SHARE_STORY_CARD_WIDTH * scale,
        height: SHARE_STORY_CARD_HEIGHT * scale,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: SHARE_STORY_CARD_WIDTH,
          height: SHARE_STORY_CARD_HEIGHT,
          transform: [
            { translateX: -(SHARE_STORY_CARD_WIDTH * (1 - scale)) / 2 },
            { translateY: -(SHARE_STORY_CARD_HEIGHT * (1 - scale)) / 2 },
            { scale },
          ],
        }}
        pointerEvents="none"
      >
        {children}
      </View>
    </View>
  );
}
