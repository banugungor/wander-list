import { palette } from "@/constants/palette";
import worldData from "@/data/worldCountries.json";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";

export type MapCountry = { id: string; name: string; d: string };

type MapView = {
  /** Zoom factor, 1 = whole world. */
  z: number;
  /** The map point (viewBox units) shown at the center of the frame. */
  cx: number;
  cy: number;
};

const WORLD_W = worldData.width;
// worldCountries.json's paths only ever occupy y ∈ [60.7, 521.4] of its
// 0–525 viewBox (empty Arctic above, Antarctica's coastline bottoming out
// around y≈521) — crop the SVG viewBox to that band (with a small margin)
// instead of rendering the full 0–525 height, so land fills the map
// top-to-bottom rather than floating in a tall box with empty margins.
export const MAP_Y = 55;
export const MAP_H = 471;
const FRAME_W = Dimensions.get("window").width;
const FRAME_H = FRAME_W * (MAP_H / WORLD_W);
/** Screen points per viewBox unit at zoom 1. */
const PPU = FRAME_W / WORLD_W;

// Tiny states/city-states (Vatican, Monaco, Singapore…) are only ~1 viewBox
// unit (<1pt on screen) wide, so the map needs a lot of headroom to tap them.
const MAX_SCALE = 30;
// One gesture may zoom out to at most half the committed zoom: the live layer
// only holds 2x the visible area, so zooming out further would show its edge.
const MIN_RELATIVE_SCALE = 0.5;
const BASE_STROKE_WIDTH = 0.6;
// Time the freshly re-rendered sharp layer gets to paint before the scaled
// (blurry) one is hidden, then to reset beneath it, before gestures unlock.
const PAINT_DELAY_MS = 120;
const RESET_DELAY_MS = 100;

const INITIAL_VIEW: MapView = { z: 1, cx: WORLD_W / 2, cy: MAP_Y + MAP_H / 2 };

/** Clamps a translation (screen points, applied after scaling by `rs` around
 * the frame center) so that (a) it stays within the margin the layer renders
 * around the visible area, and (b) the visible region stays inside the map.
 * `c0`/`minC`/`worldSize` are the committed center, the map's origin and its
 * extent along this axis (viewBox units); `viewSize` is the frame's size. */
function clampOffset(
  offset: number,
  rs: number,
  z0: number,
  c0: number,
  minC: number,
  worldSize: number,
  viewSize: number,
): number {
  "worklet";
  const total = z0 * rs;
  const ppu = PPU * total;
  const visible = worldSize / total;
  const margin = Math.max(0, viewSize * rs - viewSize / 2);
  const v = Math.min(margin, Math.max(-margin, offset));
  const lo = (c0 - (minC + worldSize - visible / 2)) * ppu;
  const hi = (c0 - (minC + visible / 2)) * ppu;
  return Math.min(hi, Math.max(lo, v));
}

// Each layer is an Svg twice the frame's size (half a frame of margin on every
// side) centered on the frame, so the map can be dragged a little before the
// next re-render without exposing an edge.
const layerBox = {
  position: "absolute",
  left: -FRAME_W / 2,
  top: -FRAME_H / 2,
  width: FRAME_W * 2,
  height: FRAME_H * 2,
} as const;

/** A single pending timeout that is cancelled when replaced or on unmount. */
function useSingleTimeout() {
  const id = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = useCallback(() => {
    if (id.current) clearTimeout(id.current);
    id.current = null;
  }, []);
  const schedule = useCallback(
    (fn: () => void, ms: number) => {
      clear();
      id.current = setTimeout(fn, ms);
    },
    [clear],
  );
  useEffect(() => clear, [clear]);
  return { schedule, clear };
}

type MapLayerProps = {
  view: MapView;
  visited: string[];
  countries: MapCountry[];
  onPressCountry: (country: MapCountry) => void;
};

/** The world drawn for one `MapView`. Re-rendering with a new view re-draws
 * the vectors at that zoom (crisp), unlike scaling an already-drawn bitmap. */
const MapLayer = memo(function MapLayer({
  view,
  visited,
  countries,
  onPressCountry,
}: MapLayerProps) {
  const vw = WORLD_W / view.z;
  const vh = MAP_H / view.z;
  const x = view.cx - vw;
  const y = view.cy - vh;
  return (
    <Svg
      width={FRAME_W * 2}
      height={FRAME_H * 2}
      viewBox={`${x} ${y} ${vw * 2} ${vh * 2}`}
    >
      <Rect x={x} y={y} width={vw * 2} height={vh * 2} fill={palette.surface} />
      {countries.map((country) => (
        <Path
          key={country.id}
          d={country.d}
          fill={visited.includes(country.id) ? palette.brand : palette.inkFaint}
          stroke={palette.surface}
          // Borders are in map units, so thin them as the map zooms or they
          // would swallow the tiny countries.
          strokeWidth={BASE_STROKE_WIDTH / view.z}
          onPress={() => onPressCountry(country)}
        />
      ))}
    </Svg>
  );
});

type WorldMapProps = {
  countries: MapCountry[];
  visited: string[];
  onPressCountry: (country: MapCountry) => void;
  style?: StyleProp<ViewStyle>;
};

/** Pinch-to-zoom / drag world map.
 *
 * Scaling a view only stretches its already-drawn bitmap, which turns blurry
 * and pixelated at high zoom. So two copies of the map are stacked:
 *  - `live` (on top) is what the gestures transform, for smooth 60fps feedback
 *    while the fingers are down (blurry during the pinch only);
 *  - `crisp` (underneath) is re-rendered at the new zoom/center on release.
 * When the fingers lift, `crisp` is re-drawn, then `live` is faded out to
 * reveal it, and only then is `live` re-synced to the new view and its
 * transform reset — all hidden beneath `crisp`, so there's no visible jump.
 * Gestures are ignored for those ~200ms (`locked`) while that happens. */
export function WorldMap({
  countries,
  visited,
  onPressCountry,
  style,
}: WorldMapProps) {
  const [crispView, setCrispView] = useState<MapView>(INITIAL_VIEW);
  const [liveView, setLiveView] = useState<MapView>(INITIAL_VIEW);
  const zoomed = crispView.z > 1;

  // Committed view mirrored for the gesture worklets.
  const z0 = useSharedValue(1);
  const cx0 = useSharedValue(INITIAL_VIEW.cx);
  const cy0 = useSharedValue(INITIAL_VIEW.cy);
  // Live transform relative to the committed view.
  const rs = useSharedValue(1);
  const rtx = useSharedValue(0);
  const rty = useSharedValue(0);
  const liveOpacity = useSharedValue(1);
  const locked = useSharedValue(false);
  const pinching = useSharedValue(false);
  // Where the fingers were (relative to the frame center) when the pinch began.
  const pinchFx = useSharedValue(0);
  const pinchFy = useSharedValue(0);

  // Stable reference so the memoized layers don't re-render on every parent
  // render just because the caller passed a new closure.
  const pressRef = useRef(onPressCountry);
  useEffect(() => {
    pressRef.current = onPressCountry;
  });
  const handlePress = useCallback(
    (country: MapCountry) => pressRef.current(country),
    [],
  );

  const timeout = useSingleTimeout();

  const commit = useCallback(
    (z: number, cx: number, cy: number) => {
      const next = { z, cx, cy };
      setCrispView(next);
      timeout.schedule(() => {
        liveOpacity.value = 0.02; // reveal the (now painted) sharp layer
        setLiveView(next);
        timeout.schedule(() => {
          rs.value = 1;
          rtx.value = 0;
          rty.value = 0;
          locked.value = false;
        }, RESET_DELAY_MS);
      }, PAINT_DELAY_MS);
    },
    [timeout, liveOpacity, rs, rtx, rty, locked],
  );

  const resetZoom = useCallback(() => {
    timeout.clear();
    z0.value = INITIAL_VIEW.z;
    cx0.value = INITIAL_VIEW.cx;
    cy0.value = INITIAL_VIEW.cy;
    rs.value = 1;
    rtx.value = 0;
    rty.value = 0;
    liveOpacity.value = 1;
    locked.value = false;
    setCrispView(INITIAL_VIEW);
    setLiveView(INITIAL_VIEW);
  }, [timeout, z0, cx0, cy0, rs, rtx, rty, liveOpacity, locked]);

  // Called on the UI thread when a gesture ends: turn the live transform into
  // a new committed view and hand it to JS to re-render sharply.
  const finish = () => {
    "worklet";
    if (locked.value) return;
    const unchanged =
      Math.abs(rs.value - 1) < 1e-3 &&
      Math.abs(rtx.value) < 0.5 &&
      Math.abs(rty.value) < 0.5;
    if (unchanged) return;
    const total = z0.value * rs.value;
    const snapped = total <= 1.02;
    const z = snapped ? 1 : total;
    const cx = snapped
      ? INITIAL_VIEW.cx
      : cx0.value - rtx.value / (PPU * total);
    const cy = snapped
      ? INITIAL_VIEW.cy
      : cy0.value - rty.value / (PPU * total);
    locked.value = true;
    z0.value = z;
    cx0.value = cx;
    cy0.value = cy;
    runOnJS(commit)(z, cx, cy);
  };

  // The live layer scales around the frame center, so a pinch keeps the map
  // point that was under the fingers at the start under them (wherever they
  // drift to) by shifting the translation to compensate: tx = f - r * f0.
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      if (locked.value) return;
      liveOpacity.value = 1;
    })
    .onStart((e) => {
      pinching.value = true;
      pinchFx.value = e.focalX - FRAME_W / 2;
      pinchFy.value = e.focalY - FRAME_H / 2;
    })
    .onUpdate((e) => {
      if (locked.value) return;
      // A gesture that began while the previous commit was still settling
      // never showed the live layer again — do it now.
      liveOpacity.value = 1;
      const lowest = Math.max(1, z0.value * MIN_RELATIVE_SCALE);
      const total = Math.min(MAX_SCALE, Math.max(lowest, z0.value * e.scale));
      const r = total / z0.value;
      const fx = e.focalX - FRAME_W / 2;
      const fy = e.focalY - FRAME_H / 2;
      rs.value = r;
      rtx.value = clampOffset(
        fx - r * pinchFx.value,
        r,
        z0.value,
        cx0.value,
        0,
        WORLD_W,
        FRAME_W,
      );
      rty.value = clampOffset(
        fy - r * pinchFy.value,
        r,
        z0.value,
        cy0.value,
        MAP_Y,
        MAP_H,
        FRAME_H,
      );
    })
    .onEnd(() => {
      pinching.value = false;
      finish();
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .minDistance(10)
    .enabled(zoomed)
    .onBegin(() => {
      if (locked.value) return;
      liveOpacity.value = 1;
    })
    .onUpdate((e) => {
      if (locked.value || pinching.value) return;
      rtx.value = clampOffset(
        e.translationX,
        rs.value,
        z0.value,
        cx0.value,
        0,
        WORLD_W,
        FRAME_W,
      );
      rty.value = clampOffset(
        e.translationY,
        rs.value,
        z0.value,
        cy0.value,
        MAP_Y,
        MAP_H,
        FRAME_H,
      );
    })
    .onEnd(() => {
      // A pan cancelled by a second finger landing belongs to the pinch.
      if (!pinching.value) finish();
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const liveStyle = useAnimatedStyle(() => ({
    opacity: liveOpacity.value,
    transform: [
      { translateX: rtx.value },
      { translateY: rty.value },
      { scale: rs.value },
    ],
  }));

  return (
    <View
      style={[{ backgroundColor: palette.surface, overflow: "hidden" }, style]}
    >
      {/* The detector wraps a static (untransformed) view so focalX/Y stay
       * in a fixed coordinate space while the live layer scales. */}
      <GestureDetector gesture={composedGesture}>
        <View
          collapsable={false}
          style={{ width: FRAME_W, height: FRAME_H, overflow: "hidden" }}
        >
          <View style={layerBox}>
            <MapLayer
              view={crispView}
              visited={visited}
              countries={countries}
              onPressCountry={handlePress}
            />
          </View>
          <Animated.View style={[layerBox, liveStyle]}>
            <MapLayer
              view={liveView}
              visited={visited}
              countries={countries}
              onPressCountry={handlePress}
            />
          </Animated.View>
        </View>
      </GestureDetector>

      {zoomed && (
        <Pressable
          onPress={resetZoom}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: palette.surface,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: palette.shadow,
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <Ionicons name="contract-outline" size={16} color={palette.ink} />
        </Pressable>
      )}
    </View>
  );
}
