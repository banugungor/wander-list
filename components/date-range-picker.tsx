import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { parseDateKey, toDateKey } from "@/data/trips";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WEEKDAYS = {
  tr: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

type DateRangePickerProps = {
  startDate: string | null;
  endDate: string | null;
  onApply: (startDate: string | null, endDate: string | null) => void;
  onClose: () => void;
};

const firstOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

/** A small month-grid calendar for picking a trip's first and last day —
 * built in JS so it needs no native date-picker module. Tap a day to set the
 * start, tap a later day to set the end; tapping again starts over.
 *
 * Not a Modal itself: it fills its parent, and is shown as an overlay inside
 * the trip form's modal (see trip-form-modal.tsx). Mount it fresh each time
 * it opens — it seeds its state from the props once. */
export function DateRangePicker({
  startDate,
  endDate,
  onApply,
  onClose,
}: DateRangePickerProps) {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [start, setStart] = useState<string | null>(startDate);
  const [end, setEnd] = useState<string | null>(endDate);
  const [month, setMonth] = useState(() =>
    firstOfMonth(parseDateKey(startDate) ?? new Date()),
  );

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    // Monday-first grid: getDay() is 0 for Sunday, so shift by one.
    const leadingBlanks = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const items: (string | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      items.push(toDateKey(new Date(year, monthIndex, day)));
    }
    return items;
  }, [month]);

  const pick = (key: string) => {
    if (!start || end) {
      setStart(key);
      setEnd(null);
    } else if (key < start) {
      setStart(key);
    } else {
      setEnd(key);
    }
  };

  const shiftMonth = (delta: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const locale = language === "tr" ? "tr-TR" : "en-GB";
  const todayKey = toDateKey(new Date());

  return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.cream,
          paddingTop: insets.top + 40,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: palette.ink }}>
            {t("trips.dateTitle")}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={palette.inkMuted} />
          </Pressable>
        </View>
        <Text style={{ marginTop: 6, fontSize: 13, color: palette.inkMuted }}>
          {t("trips.dateHint")}
        </Text>

        <View
          style={{
            marginTop: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={palette.ink} />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "700", color: palette.ink }}>
            {month.toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={22} color={palette.ink} />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", marginTop: 14 }}>
          {WEEKDAYS[language].map((label) => (
            <Text
              key={label}
              style={{
                width: `${100 / 7}%`,
                textAlign: "center",
                fontSize: 12,
                color: palette.inkMuted,
              }}
            >
              {label}
            </Text>
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {cells.map((key, index) => {
            if (!key) {
              return <View key={`blank-${index}`} style={{ width: `${100 / 7}%`, height: 46 }} />;
            }
            const isEdge = key === start || key === end;
            const inRange = !!start && !!end && key > start && key < end;
            return (
              <Pressable
                key={key}
                onPress={() => pick(key)}
                style={{
                  width: `${100 / 7}%`,
                  height: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: inRange ? palette.greenSoft : "transparent",
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isEdge ? palette.brand : "transparent",
                    borderWidth: key === todayKey && !isEdge ? 1 : 0,
                    borderColor: palette.brand,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: isEdge ? "700" : "500",
                      color: isEdge ? palette.surface : palette.ink,
                    }}
                  >
                    {Number(key.slice(8))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View
          style={{
            marginTop: "auto",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
          }}
        >
          <Pressable
            onPress={() => {
              setStart(null);
              setEnd(null);
            }}
            style={{
              paddingHorizontal: 20,
              height: 50,
              borderRadius: 25,
              backgroundColor: palette.creamDeep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: palette.inkMuted }}>
              {t("trips.dateClear")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onApply(start, end)}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 25,
              backgroundColor: palette.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>
              {t("trips.dateApply")}
            </Text>
          </Pressable>
        </View>
      </View>
  );
}
