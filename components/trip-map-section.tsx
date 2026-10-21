import { OffscreenShareCard } from "@/components/offscreen-share-card";
import { ShareTripMapCard } from "@/components/share-trip-map-card";
import { SharePillButton } from "@/components/share-pill-button";
import { TripMap, dayColor } from "@/components/trip-map";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { pickCityMap } from "@/data/cityMaps";
import { collectTripStops, splitByMap } from "@/data/tripStops";
import { formatDateRange, type Trip } from "@/data/trips";
import { useLandmarkCoords } from "@/hooks/use-landmark-coords";
import { useMapIcons } from "@/hooks/use-map-icons";
import { useShareStory } from "@/hooks/use-share-story";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const MAP_ASPECT = 0.95; // height / width

/** The "Harita" block of a trip's detail screen: the trip's landmarks and
 * heritage sites on a stylised city map (components/trip-map.tsx), a per-day
 * filter, and a share-to-story button. Renders nothing when none of the
 * trip's activities has coordinates on a city map we have — which is every
 * trip outside the cities listed in data/cityMaps.ts. */
export function TripMapSection({ trip }: { trip: Trip }) {
  const { t, language } = useLanguage();
  const landmarkCoords = useLandmarkCoords();
  const icons = useMapIcons();
  const { cardRef, sharing, share } = useShareStory();

  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [width, setWidth] = useState(0);

  const { map, onMap, outsideCount } = useMemo(() => {
    const stops = collectTripStops(trip.days, landmarkCoords);
    const picked = pickCityMap(stops.map((stop) => stop.position));
    if (!picked) return { map: null, onMap: [], outsideCount: 0 };
    return { map: picked, ...splitByMap(stops, picked) };
  }, [trip.days, landmarkCoords]);

  if (!map || onMap.length === 0) return null;

  const daysWithStops = [...new Set(onMap.map((stop) => stop.dayIndex))];
  // A filter pointing at a day that has since been deleted or emptied falls
  // back to "all".
  const activeDay = dayFilter !== null && daysWithStops.includes(dayFilter) ? dayFilter : null;
  const visibleStops =
    activeDay === null ? onMap : onMap.filter((stop) => stop.dayIndex === activeDay);

  const selectDay = (dayIndex: number | null) => {
    setDayFilter(dayIndex);
    setSelectedKey(null);
  };

  return (
    <View style={{ marginTop: 22, marginBottom: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: palette.ink }}>
          {t("trips.mapTitle")}
        </Text>
        <SharePillButton label={t("trips.mapShare")} onPress={share} loading={sharing} />
      </View>

      {daysWithStops.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 12 }}
        >
          <DayChip
            label={t("trips.mapAllDays")}
            active={activeDay === null}
            onPress={() => selectDay(null)}
          />
          {daysWithStops.map((dayIndex) => (
            <DayChip
              key={dayIndex}
              label={t("trips.dayDefault", { n: dayIndex + 1 })}
              color={dayColor(dayIndex)}
              active={activeDay === dayIndex}
              onPress={() => selectDay(dayIndex)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View
        onLayout={(event) => setWidth(Math.floor(event.nativeEvent.layout.width))}
        style={{ marginTop: 12 }}
      >
        {width > 0 ? (
          <TripMap
            map={map}
            stops={visibleStops}
            icons={icons}
            width={width}
            height={Math.round(width * MAP_ASPECT)}
            labelMode="selected"
            selectedKey={selectedKey}
            onSelectStop={setSelectedKey}
            style={{ borderRadius: 20, borderWidth: 1, borderColor: palette.hairline }}
          />
        ) : null}
      </View>

      {outsideCount > 0 ? (
        <Text style={{ marginTop: 8, fontSize: 12, color: palette.inkMuted }}>
          {t("trips.mapOutside", { count: outsideCount })}
        </Text>
      ) : null}

      <OffscreenShareCard>
        <ShareTripMapCard
          ref={cardRef}
          title={trip.title}
          dates={formatDateRange(trip.startDate, trip.endDate, language)}
          map={map}
          stops={onMap}
          icons={icons}
          dayCount={trip.days.length}
        />
      </OffscreenShareCard>
    </View>
  );
}

function DayChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  /** The day's pin colour, shown as a dot. */
  color?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        backgroundColor: active ? palette.brand : palette.surface,
        borderWidth: 1,
        borderColor: active ? palette.brand : palette.hairlineStrong,
      }}
    >
      {color ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: active ? palette.surface : color,
          }}
        />
      ) : null}
      <Text style={{ fontSize: 13, fontWeight: "600", color: active ? palette.surface : palette.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}
