import { CountryFlag } from "@/components/country-flag";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import type { CountryYears } from "@/data/profileExtras";
import { buildTravelTimeline } from "@/data/travelTimeline";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

const COLLAPSED_UNDATED = 18;

type Props = {
  visitedIds: string[];
  years: CountryYears;
  /** A flag was tapped: the screen opens the year picker for that country. */
  onCountryPress: (countryId: string) => void;
};

/** "Yolculuğum": visited countries grouped by the year they were visited, newest
 * year first, with the ones that have no year yet at the bottom. Tapping a flag
 * sets or changes its year. */
export function TravelTimeline({ visitedIds, years, onCountryPress }: Props) {
  const { t } = useLanguage();
  const [expandedUndated, setExpandedUndated] = useState(false);
  const timeline = useMemo(
    () => buildTravelTimeline(visitedIds, years),
    [visitedIds, years],
  );

  const flags = (countries: typeof timeline.undated) =>
    countries.map((c) => (
      <Pressable
        key={c.id}
        onPress={() => onCountryPress(c.id)}
        hitSlop={4}
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          backgroundColor: palette.cream,
        }}
      >
        <CountryFlag id={c.id} iso2={c.iso2} size={22} />
      </Pressable>
    ));

  const undatedShown = expandedUndated
    ? timeline.undated
    : timeline.undated.slice(0, COLLAPSED_UNDATED);
  const undatedExtra = timeline.undated.length - COLLAPSED_UNDATED;

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 18,
        padding: 16,
        shadowColor: palette.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      {visitedIds.length === 0 ? (
        <Text style={{ fontSize: 13, color: palette.inkMuted }}>
          {t("me.passportEmpty")}
        </Text>
      ) : (
        <>
          {timeline.years.length === 0 ? (
            <Text style={{ fontSize: 13, color: palette.inkMuted }}>
              {t("me.timelineHint")}
            </Text>
          ) : null}

          {timeline.years.map((group, i) => (
            <View key={group.year} style={{ marginTop: i === 0 ? 0 : 18 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: palette.brand }}>
                  {group.year}
                </Text>
                <Text style={{ fontSize: 12, color: palette.inkMuted }}>
                  {t("me.timelineCount", { count: group.countries.length })}
                </Text>
              </View>
              <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {flags(group.countries)}
              </View>
            </View>
          ))}

          {timeline.undated.length > 0 ? (
            <View style={{ marginTop: timeline.years.length === 0 ? 14 : 18 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: palette.inkMuted }}>
                  {t("me.timelineNoYear")}
                </Text>
                <Text style={{ fontSize: 12, color: palette.inkFaint }}>
                  {t("me.timelineCount", { count: timeline.undated.length })}
                </Text>
              </View>
              <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {flags(undatedShown)}
                {undatedExtra > 0 ? (
                  <Pressable
                    onPress={() => setExpandedUndated((v) => !v)}
                    style={{
                      height: 40,
                      paddingHorizontal: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderStyle: "dashed",
                      borderColor: palette.inkFaint,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: palette.inkMuted }}>
                      {expandedUndated ? t("me.showLess") : `+${undatedExtra}`}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              {timeline.years.length > 0 ? (
                <Text style={{ marginTop: 10, fontSize: 11, color: palette.inkFaint }}>
                  {t("me.timelineHint")}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
