import { ScreenHeader } from "@/components/screen-header";
import { TextInputModal } from "@/components/text-input-modal";
import { TripActivityPicker, type ActivityDraft } from "@/components/trip-activity-picker";
import { TripCover } from "@/components/trip-cover";
import { TripFormModal } from "@/components/trip-form-modal";
import { TripMapSection } from "@/components/trip-map-section";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getHeritageSiteById } from "@/data/heritageSites";
import { mapIconUrlForRef } from "@/data/mapIcons";
import { showTripMenu } from "@/data/tripAlerts";
import { formatDateRange, newId, type Trip, type TripDay, type TripDraft } from "@/data/trips";
import { useLandmarkDetailIds } from "@/hooks/use-landmark-detail-ids";
import { useMapIcons } from "@/hooks/use-map-icons";
import { useTrips } from "@/hooks/use-trips";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

// Back / menu buttons sit on the photo, so they need a backdrop that reads on any picture.
const OVER_PHOTO_BG = "rgba(255,255,255,0.85)";

type TextTarget =
  | { type: "editActivity"; dayId: string; activityId: string }
  | { type: "dayTitle"; dayId: string };

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useLanguage();
  const mapIcons = useMapIcons();
  const landmarkDetailIds = useLandmarkDetailIds();
  const { trips, sessionReady, loading, update, remove } = useTrips();

  const trip = trips.find((candidate) => candidate.id === id);

  const [textTarget, setTextTarget] = useState<TextTarget | null>(null);
  // Day whose "add activity" picker is open (null = closed).
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  // Day currently in reorder mode (↑ ↓ on each activity), null = none.
  const [reorderDayId, setReorderDayId] = useState<string | null>(null);
  const [editFormVisible, setEditFormVisible] = useState(false);
  // While a delete is in flight (and the screen is about to pop), keep showing
  // a spinner instead of flashing "trip not found" once the row is gone.
  const [deleting, setDeleting] = useState(false);

  // Snapshot of the trip's form fields, taken when the edit form opens.
  const [editInitial, setEditInitial] = useState<TripDraft | undefined>();

  const showSaveError = (e: unknown) => {
    console.log("TRIP UPDATE ERROR", e);
    Alert.alert(t("trips.saveFailed"));
  };

  const saveDays = async (current: Trip, days: TripDay[]) => {
    try {
      await update(current.id, { days });
    } catch (e) {
      showSaveError(e);
    }
  };

  const mapDay = (current: Trip, dayId: string, change: (day: TripDay) => TripDay) =>
    current.days.map((day) => (day.id === dayId ? change(day) : day));

  if (deleting || !sessionReady || (loading && !trip)) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.cream, alignItems: "center", justifyContent: "center" }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={palette.brand} />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.cream }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={t("trips.itinerary")} />
        <Text style={{ textAlign: "center", marginTop: 60, color: palette.inkMuted }}>
          {t("trips.notFound")}
        </Text>
      </View>
    );
  }

  const dates = formatDateRange(trip.startDate, trip.endDate, language);

  const openEditForm = () => {
    setEditInitial({
      title: trip.title,
      countryId: trip.countryId,
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
    setEditFormVisible(true);
  };
  const defaultDayTitle = (index: number) => t("trips.dayDefault", { n: index + 1 });

  const openTripMenu = () =>
    showTripMenu(t, trip, {
      onEdit: openEditForm,
      onDelete: async () => {
        setDeleting(true);
        try {
          await remove(trip.id);
          router.back();
        } catch (e) {
          console.log("TRIP DELETE ERROR", e);
          setDeleting(false);
          Alert.alert(t("trips.deleteFailed"));
        }
      },
    });

  const confirmDeleteDay = (day: TripDay) => {
    Alert.alert(t("trips.deleteDay"), t("trips.deleteDayMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("trips.delete"),
        style: "destructive",
        onPress: () =>
          saveDays(
            trip,
            trip.days.filter((candidate) => candidate.id !== day.id),
          ),
      },
    ]);
  };

  // Swaps an activity with its neighbour. The order is also the map's route
  // order (data/tripStops.ts), so it is saved like any other edit.
  const moveActivity = (dayId: string, from: number, delta: -1 | 1) => {
    const to = from + delta;
    saveDays(
      trip,
      mapDay(trip, dayId, (day) => {
        if (to < 0 || to >= day.activities.length) return day;
        const activities = [...day.activities];
        [activities[from], activities[to]] = [activities[to], activities[from]];
        return { ...day, activities };
      }),
    );
  };

  const openDayMenu = (day: TripDay, index: number) => {
    Alert.alert(day.title || defaultDayTitle(index), undefined, [
      { text: t("trips.renameDay"), onPress: () => setTextTarget({ type: "dayTitle", dayId: day.id }) },
      ...(day.activities.length > 1
        ? [{ text: t("trips.reorderDay"), onPress: () => setReorderDayId(day.id) }]
        : []),
      { text: t("trips.deleteDay"), style: "destructive", onPress: () => confirmDeleteDay(day) },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const addDay = () =>
    saveDays(trip, [...trip.days, { id: newId(), title: "", activities: [] }]);

  const addActivities = (dayId: string, drafts: ActivityDraft[]) => {
    setPickerDayId(null);
    saveDays(
      trip,
      mapDay(trip, dayId, (day) => ({
        ...day,
        activities: [...day.activities, ...drafts.map((draft) => ({ id: newId(), ...draft }))],
      })),
    );
  };

  // The paywall can't open over the picker's Modal on iOS, so close it first
  // and navigate once it's gone (same delay as the trips list uses).
  const openPaywallFromPicker = () => {
    setPickerDayId(null);
    setTimeout(() => router.push({ pathname: "/paywall", params: { category: "tripDetail" } }), 450);
  };

  const handleTextSubmit = (value: string) => {
    if (!textTarget) return;
    const target = textTarget;
    setTextTarget(null);

    if (target.type === "editActivity") {
      saveDays(
        trip,
        mapDay(trip, target.dayId, (day) => ({
          ...day,
          activities: day.activities.map((activity) =>
            activity.id === target.activityId ? { ...activity, text: value } : activity,
          ),
        })),
      );
    } else {
      saveDays(trip, mapDay(trip, target.dayId, (day) => ({ ...day, title: value })));
    }
  };

  const handleTextDelete = () => {
    if (textTarget?.type !== "editActivity") return;
    const target = textTarget;
    setTextTarget(null);
    saveDays(
      trip,
      mapDay(trip, target.dayId, (day) => ({
        ...day,
        activities: day.activities.filter((activity) => activity.id !== target.activityId),
      })),
    );
  };

  // Picked-from-list heritage places have a page of their own (if the bundled
  // site still exists), and so do landmarks the admin wrote details for;
  // dishes and islands have no per-item screen. Navigates once the modal has
  // finished dismissing (see trips.tsx for why).
  const editedActivity =
    textTarget?.type === "editActivity"
      ? trip.days
          .find((day) => day.id === textTarget.dayId)
          ?.activities.find((activity) => activity.id === textTarget.activityId)
      : undefined;
  const placePath = (() => {
    const ref = editedActivity?.ref;
    if (ref?.category === "heritage" && getHeritageSiteById(ref.id)) {
      return `/heritage/${ref.id}`;
    }
    if (ref?.category === "landmarks" && landmarkDetailIds[ref.id]) {
      return `/landmark/${ref.id}`;
    }
    return null;
  })();
  const openPlacePage = () => {
    if (!placePath) return;
    setTextTarget(null);
    setTimeout(() => router.push(placePath as never), 450);
  };

  const pickerDayIndex = trip.days.findIndex((day) => day.id === pickerDayId);
  const pickerDay = trip.days[pickerDayIndex];

  const textModal = (() => {
    if (!textTarget) return null;
    const day = trip.days.find((candidate) => candidate.id === textTarget.dayId);
    if (!day) return null;

    if (textTarget.type === "dayTitle") {
      return {
        title: t("trips.renameDay"),
        initialValue: day.title,
        placeholder: t("trips.dayTitlePlaceholder"),
        submitLabel: t("trips.save"),
        allowEmpty: true,
      };
    }
    if (textTarget.type === "editActivity") {
      const activity = day.activities.find((a) => a.id === textTarget.activityId);
      return {
        title: t("trips.editActivity"),
        initialValue: activity?.text ?? "",
        placeholder: t("trips.activityPlaceholder"),
        submitLabel: t("trips.save"),
        allowEmpty: false,
      };
    }
    return null;
  })();

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floats over the cover photo, which runs up under the status bar. */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <ScreenHeader
          title=""
          accentBg={OVER_PHOTO_BG}
          right={
            <Pressable
              onPress={openTripMenu}
              accessibilityLabel={t("trips.menuLabel")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: OVER_PHOTO_BG,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={palette.greenText} />
            </Pressable>
          }
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 60 }}>
        <TripCover
          title={trip.title}
          countryId={trip.countryId}
          markSize={120}
          // Bleeds out of the ScrollView's 20pt side padding to span the full screen width.
          style={{ height: 300, marginHorizontal: -20 }}
        />
        {/* Rounded top edge that overlaps the photo's bottom, so the content reads as a sheet. */}
        <View
          pointerEvents="none"
          style={{
            height: 28,
            marginHorizontal: -20,
            marginTop: -28,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: palette.cream,
          }}
        />

        <View style={{ marginTop: 20, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={openEditForm}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={{ flexShrink: 1, fontSize: 24, fontWeight: "700", color: palette.ink }}>
                {trip.title}
              </Text>
              <Ionicons name="pencil" size={16} color={palette.inkMuted} />
            </Pressable>
            <Text style={{ marginTop: 6, fontSize: 14, color: palette.inkMuted }}>
              {trip.days.length > 0
                ? t("trips.daysCount", { count: trip.days.length })
                : t("trips.cardMetaNoDays")}
              {dates ? ` · ${dates}` : ""}
            </Text>
          </View>
        </View>

        <TripMapSection trip={trip} />

        <View style={{ marginTop: 28 }}>
          {trip.days.length === 0 ? (
            <Text style={{ textAlign: "center", color: palette.inkMuted, marginBottom: 20 }}>
              {t("trips.noDays")}
            </Text>
          ) : null}

          {trip.days.map((day, index) => {
            const reordering = reorderDayId === day.id;
            return (
            <View key={day.id} style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ width: 44, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: palette.inkMuted }}>{t("trips.dayLabel")}</Text>
                <View
                  style={{
                    marginTop: 4,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: palette.brand,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>
                    {index + 1}
                  </Text>
                </View>
                {index < trip.days.length - 1 ? (
                  <View
                    style={{
                      flex: 1,
                      marginVertical: 4,
                      borderLeftWidth: 2,
                      borderStyle: "dotted",
                      borderColor: palette.greenSoftDeep,
                    }}
                  />
                ) : null}
              </View>

              <View
                style={{
                  flex: 1,
                  marginBottom: 14,
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: palette.surface,
                  borderWidth: 1,
                  borderColor: palette.hairline,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Pressable
                    onPress={() => setTextTarget({ type: "dayTitle", dayId: day.id })}
                    style={{ flex: 1 }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: palette.ink }}>
                      {day.title || defaultDayTitle(index)}
                    </Text>
                  </Pressable>
                  {reordering ? (
                    <Pressable onPress={() => setReorderDayId(null)} hitSlop={10}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: palette.brand }}>
                        {t("trips.reorderDone")}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => openDayMenu(day, index)} hitSlop={10}>
                      <Ionicons name="ellipsis-horizontal" size={20} color={palette.inkMuted} />
                    </Pressable>
                  )}
                </View>

                {day.activities.map((activity, activityIndex) => (
                  <Pressable
                    key={activity.id}
                    disabled={reordering}
                    onPress={() =>
                      setTextTarget({ type: "editActivity", dayId: day.id, activityId: activity.id })
                    }
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}
                  >
                    <ActivityLeadIcon activity={activity} icons={mapIcons} />
                    <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: palette.ink }}>
                      {activity.text}
                    </Text>
                    {reordering ? (
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <MoveButton
                          icon="chevron-up"
                          label={t("trips.moveUp")}
                          disabled={activityIndex === 0}
                          onPress={() => moveActivity(day.id, activityIndex, -1)}
                        />
                        <MoveButton
                          icon="chevron-down"
                          label={t("trips.moveDown")}
                          disabled={activityIndex === day.activities.length - 1}
                          onPress={() => moveActivity(day.id, activityIndex, 1)}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                ))}

                {reordering ? null : (
                  <Pressable
                    onPress={() => setPickerDayId(day.id)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={palette.brand} />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: palette.brand }}>
                      {t("trips.addActivity")}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
            );
          })}
        </View>

        <Pressable
          onPress={addDay}
          style={{
            marginTop: 6,
            height: 52,
            borderRadius: 26,
            backgroundColor: palette.brand,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name="add" size={20} color={palette.surface} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>
            {t("trips.addDay")}
          </Text>
        </Pressable>
      </ScrollView>

      <TextInputModal
        visible={textModal !== null}
        title={textModal?.title ?? ""}
        initialValue={textModal?.initialValue}
        placeholder={textModal?.placeholder}
        submitLabel={textModal?.submitLabel ?? ""}
        allowEmpty={textModal?.allowEmpty}
        onSubmit={handleTextSubmit}
        onClose={() => setTextTarget(null)}
        onDelete={textTarget?.type === "editActivity" ? handleTextDelete : undefined}
        deleteLabel={t("trips.delete")}
        linkAction={
          placePath ? { label: t("trips.openPlacePage"), onPress: openPlacePage } : undefined
        }
      />

      <TripActivityPicker
        visible={pickerDayId !== null}
        dayLabel={pickerDay ? pickerDay.title || defaultDayTitle(pickerDayIndex) : ""}
        initialCountryId={trip.countryId}
        onClose={() => setPickerDayId(null)}
        onSubmit={(drafts) => pickerDayId && addActivities(pickerDayId, drafts)}
        onNeedMembership={openPaywallFromPicker}
      />

      <TripFormModal
        visible={editFormVisible}
        mode="edit"
        initial={editInitial}
        onClose={() => setEditFormVisible(false)}
        onSubmit={(draft) => update(trip.id, draft)}
      />
    </View>
  );
}

/** One ↑ / ↓ button of a day's reorder mode. */
/** Bullet in front of an activity: the place's map icon when it has one, else
 * its category icon (picked from a list) or a plain dot (hand-typed). */
function ActivityLeadIcon({
  activity,
  icons,
}: {
  activity: TripDay["activities"][number];
  icons: Record<string, string>;
}) {
  const iconUrl = mapIconUrlForRef(icons, activity.ref);
  if (iconUrl) {
    return <Image source={{ uri: iconUrl }} style={{ width: 38, height: 35 }} contentFit="contain" />;
  }
  if (!activity.ref) return <Text style={{ fontSize: 14, color: palette.brand }}>•</Text>;
  const category = getCategory(activity.ref.category);
  return (
    <Ionicons
      name={category?.icon ?? "location-outline"}
      size={25}
      color={category?.fg ?? palette.brand}
      style={{ marginTop: 2 }}
    />
  );
}

function MoveButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: "chevron-up" | "chevron-down";
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.greenSoft,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Ionicons name={icon} size={18} color={palette.greenText} />
    </Pressable>
  );
}
