import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { fitViewBox, projectToMap, type CityMap } from "@/data/cityMaps";
import { mapIconKey } from "@/data/mapIcons";
import type { TripStop } from "@/data/tripStops";
import { Image } from "expo-image";
import { useMemo } from "react";
import { Linking, Pressable, Text, View, type ViewStyle } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

// Soft paper-map palette — the stylised look is the point, not realism.
const LAND = "#F4EBD6";
const GREEN = "#CFE3B4";
const WATER = "#A9D3E6";
const WATER_LABEL = "#5E97B8";
const ROAD = "#FFFFFF";

/** Pin colour per trip day, cycling. Exported so the day filter chips can
 * show the same colours. */
export const DAY_COLORS = [
  palette.brand,
  palette.coral,
  palette.violet,
  palette.blueText,
  palette.amberText,
  palette.tealText,
];
export const dayColor = (dayIndex: number) => DAY_COLORS[dayIndex % DAY_COLORS.length];

// The river is drawn in map units (it is a real width: ~9 units is the Tiber)
// but never thinner than a few screen pixels; roads are in screen pixels so
// zooming into a few stops doesn't turn them into thick bars.
const RIVER_UNITS = 9;
const RIVER_MIN_PX = 4;
const MAJOR_ROAD_PX = 3;
const MINOR_ROAD_PX = 1.5;

const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";

type TripMapProps = {
  map: CityMap;
  /** Stops that fall on `map`, in route order (see data/tripStops.ts). */
  stops: TripStop[];
  /** `mapIconKey` → icon URL (data/mapIcons.ts). A stop with an icon gets it
   * drawn above its position; the rest keep the plain numbered pin. */
  icons?: Record<string, string>;
  width: number;
  height: number;
  /** "selected": only the tapped pin shows its name (the interactive map).
   * "fit": every pin gets a name tag where one fits (the share card). */
  labelMode: "selected" | "fit";
  selectedKey?: string | null;
  onSelectStop?: (key: string | null) => void;
  pinSize?: number;
  style?: ViewStyle;
};

type Box = { left: number; top: number; width: number; height: number };
type PlacedLabel = Box & { key: string };

const overlaps = (a: PlacedLabel, b: { left: number; top: number; width: number; height: number }) =>
  a.left < b.left + b.width &&
  b.left < a.left + a.width &&
  a.top < b.top + b.height &&
  b.top < a.top + a.height;

/** Greedy name-tag placement: each tag goes right of its pin (icon included),
 * else left, and is skipped when it would cover another tag or any pin. Order
 * matters — earlier stops win — which matches the numbering. */
function placeLabels(
  pins: { key: string; x: number; y: number; name: string; box: Box }[],
  width: number,
  height: number,
  fontSize: number,
): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const tagHeight = fontSize + 8;

  for (const pin of pins) {
    const tagWidth = Math.ceil(pin.name.length * fontSize * 0.55) + 14;
    const top = pin.y - tagHeight / 2;
    const candidates = [pin.box.left + pin.box.width + 2, pin.box.left - 2 - tagWidth];
    for (const left of candidates) {
      const box: PlacedLabel = { key: pin.key, left, top, width: tagWidth, height: tagHeight };
      const insideFrame = left >= 2 && left + tagWidth <= width - 2 && top >= 2 && top + tagHeight <= height - 2;
      if (!insideFrame) continue;
      if (placed.some((other) => overlaps(other, box))) continue;
      if (pins.some((other) => overlaps(box, other.box))) continue;
      placed.push(box);
      break;
    }
  }
  return placed;
}

/** A trip's mappable stops drawn on a stylised city base map: numbered pins
 * (coloured by day) joined by a dashed route in visiting order. The base map
 * is pre-built vector data (data/cityMaps.ts), so this needs no network and
 * no native map module — it is plain react-native-svg plus absolutely
 * positioned pins, which also lets the share card capture it. */
export function TripMap({
  map,
  stops,
  icons = {},
  width,
  height,
  labelMode,
  selectedKey = null,
  onSelectStop,
  pinSize = 26,
  style,
}: TripMapProps) {
  const { language } = useLanguage();

  const layout = useMemo(() => {
    const points = stops.map((stop) => projectToMap(map, stop.position));
    const view = fitViewBox(map, points, width / height);
    const scale = width / view.width;
    const toScreen = (p: { x: number; y: number }) => ({
      x: (p.x - view.x) * scale,
      y: (p.y - view.y) * scale,
    });
    const placedPins = stops.map((stop, index) => ({
      stop,
      number: index + 1,
      iconUrl: icons[mapIconKey(stop.category, stop.refId)] ?? null,
      ...toScreen(points[index]),
    }));

    // Icons are drawn above their position at one shared size, shrunk when
    // two iconed stops are close so they overlap less (they still can: the
    // map has no zoom). The numbered dot stays on the exact position.
    const iconed = placedPins.filter((p) => p.iconUrl);
    let nearest = Infinity;
    for (let i = 0; i < iconed.length; i += 1) {
      for (let j = i + 1; j < iconed.length; j += 1) {
        nearest = Math.min(nearest, Math.hypot(iconed[i].x - iconed[j].x, iconed[i].y - iconed[j].y));
      }
    }
    const baseIconSize = Math.round(pinSize * 2.1);
    const iconSize = Math.round(
      Math.min(baseIconSize, Math.max(pinSize * 1.3, nearest * 0.95)),
    );
    const dotSize = Math.round(pinSize * 0.74);

    const pins = placedPins.map((pin) => {
      const box: Box = pin.iconUrl
        ? {
            left: pin.x - iconSize / 2,
            top: pin.y - iconSize - dotSize / 2,
            width: iconSize,
            height: iconSize + dotSize,
          }
        : { left: pin.x - pinSize / 2, top: pin.y - pinSize / 2, width: pinSize, height: pinSize };
      return { ...pin, box };
    });
    // The route is drawn inside the SVG, so it stays in map units.
    const route =
      points.length > 1
        ? points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("")
        : "";
    return { view, scale, pins, toScreen, route, iconSize, dotSize };
  }, [map, stops, icons, width, height, pinSize]);

  const { view, scale, pins, toScreen, route, iconSize, dotSize } = layout;

  const labelFontSize = 11;
  const fitLabels = useMemo(
    () =>
      labelMode === "fit"
        ? placeLabels(
            pins.map((p) => ({ key: p.stop.key, x: p.x, y: p.y, name: p.stop.name, box: p.box })),
            width,
            height,
            labelFontSize,
          )
        : [],
    [labelMode, pins, width, height],
  );

  const selected = pins.find((p) => p.stop.key === selectedKey) ?? null;

  const openCopyright = () => {
    Linking.openURL(OSM_COPYRIGHT_URL).catch((e) => console.log("OPEN OSM COPYRIGHT ERROR", e));
  };

  return (
    <View style={[{ width, height, overflow: "hidden", backgroundColor: LAND }, style]}>
      <Svg
        width={width}
        height={height}
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      >
        {/* Fills past the map's own edge when the view hangs over it. */}
        <Rect x={-map.width} y={-map.height} width={map.width * 3} height={map.height * 3} fill={LAND} />
        <Path d={map.green} fill={GREEN} />
        <Path d={map.water} fill={WATER} />
        <Path
          d={map.canals}
          fill="none"
          stroke={WATER}
          strokeWidth={Math.max(RIVER_UNITS / 3, RIVER_MIN_PX / 3 / scale)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={map.rivers}
          fill="none"
          stroke={WATER}
          strokeWidth={Math.max(RIVER_UNITS, RIVER_MIN_PX / scale)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={map.minor}
          fill="none"
          stroke={ROAD}
          strokeWidth={MINOR_ROAD_PX / scale}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={map.major}
          fill="none"
          stroke={ROAD}
          strokeWidth={MAJOR_ROAD_PX / scale}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {route ? (
          <Path
            d={route}
            fill="none"
            stroke={palette.ink}
            strokeOpacity={0.65}
            strokeWidth={2 / scale}
            strokeDasharray={[6 / scale, 5 / scale]}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>

      {map.labels.map((label) => {
        const at = toScreen(label);
        if (at.x < 0 || at.x > width - 40 || at.y < 0 || at.y > height - 16) return null;
        return (
          <Text
            key={label.text}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: at.x,
              top: at.y,
              fontSize: 11,
              fontStyle: "italic",
              color: WATER_LABEL,
            }}
          >
            {language === "tr" ? label.textTr : label.text}
          </Text>
        );
      })}

      {/* Icons first, southern ones in front of northern ones, the selected one
          on top; the numbered dots then sit over every icon. */}
      {[...pins]
        .filter((pin) => pin.iconUrl)
        .sort((a, b) => Number(a === selected) - Number(b === selected) || a.y - b.y)
        .map((pin) => (
          <Pressable
            key={`icon-${pin.stop.key}`}
            disabled={!onSelectStop}
            onPress={() => onSelectStop?.(pin === selected ? null : pin.stop.key)}
            style={{
              position: "absolute",
              left: pin.box.left,
              top: pin.box.top,
              width: iconSize,
              height: iconSize,
            }}
          >
            <Image
              source={{ uri: pin.iconUrl ?? undefined }}
              contentFit="contain"
              contentPosition="bottom"
              style={{ width: iconSize, height: iconSize }}
            />
          </Pressable>
        ))}

      {[...pins].sort((a, b) => Number(a === selected) - Number(b === selected)).map((pin) => {
        const isSelected = pin === selected;
        const base = pin.iconUrl ? dotSize : pinSize;
        const size = isSelected ? base + 6 : base;
        return (
          <Pressable
            key={pin.stop.key}
            disabled={!onSelectStop}
            onPress={() => onSelectStop?.(isSelected ? null : pin.stop.key)}
            hitSlop={6}
            style={{
              position: "absolute",
              left: pin.x - size / 2,
              top: pin.y - size / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: dayColor(pin.stop.dayIndex),
              borderWidth: 2,
              borderColor: palette.surface,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: palette.shadow,
              shadowOpacity: 0.25,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: base * 0.46, fontWeight: "800", color: palette.surface }}>
              {pin.number}
            </Text>
          </Pressable>
        );
      })}

      {fitLabels.map((label) => {
        const pin = pins.find((p) => p.stop.key === label.key);
        if (!pin) return null;
        return (
          <View
            key={label.key}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: label.left,
              top: label.top,
              width: label.width,
              height: label.height,
              borderRadius: label.height / 2,
              backgroundColor: "rgba(255,255,255,0.92)",
              justifyContent: "center",
              paddingHorizontal: 7,
            }}
          >
            <Text numberOfLines={1} style={{ fontSize: labelFontSize, fontWeight: "700", color: palette.ink }}>
              {pin.stop.name}
            </Text>
          </View>
        );
      })}

      {labelMode === "selected" && selected ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            // Centred above the pin, kept inside the frame.
            left: Math.min(Math.max(selected.x - 90, 6), width - 186),
            top: Math.max(selected.box.top - 40, 6),
            width: 180,
            alignItems: "center",
          }}
        >
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 14,
              backgroundColor: palette.surface,
              shadowColor: palette.shadow,
              shadowOpacity: 0.2,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: palette.ink, textAlign: "center" }}>
              {selected.stop.name}
            </Text>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={openCopyright}
        hitSlop={8}
        style={{
          position: "absolute",
          left: 6,
          bottom: 5,
          paddingHorizontal: 5,
          paddingVertical: 1,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.7)",
        }}
      >
        <Text style={{ fontSize: 9, color: palette.inkMuted }}>© OpenStreetMap contributors</Text>
      </Pressable>
    </View>
  );
}
