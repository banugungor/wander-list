import { MAP_H, MAP_Y } from "@/components/world-map";
import { palette } from "@/constants/palette";
import worldData from "@/data/worldCountries.json";
import { memo, useMemo } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
  visitedIds: string[];
};

// Static, non-interactive world map for the profile — same flat grey base +
// single accent colour as the interactive one on the Places screen.
function WorldMapPreviewImpl({ visitedIds }: Props) {
  const visited = useMemo(() => new Set(visitedIds), [visitedIds]);

  return (
    <View
      pointerEvents="none"
      style={{ width: "100%", aspectRatio: worldData.width / MAP_H }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 ${MAP_Y} ${worldData.width} ${MAP_H}`}
      >
        {worldData.countries.map((c) => (
          <Path
            key={c.id}
            d={c.d}
            fill={visited.has(c.id) ? palette.brand : palette.inkFaint}
            stroke={palette.surface}
            strokeWidth={0.6}
          />
        ))}
      </Svg>
    </View>
  );
}

export const WorldMapPreview = memo(WorldMapPreviewImpl);
