import { ScreenHeader } from "@/components/screen-header";
import { TextInputModal } from "@/components/text-input-modal";
import { TripCover } from "@/components/trip-cover";
import { TripFormModal } from "@/components/trip-form-modal";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { showTripMenu } from "@/data/tripAlerts";
import { formatDateRange, newId, type Trip, type TripDay, type TripDraft } from "@/data/trips";
import { useTrips } from "@/hooks/use-trips";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

type TextTarget =
  | { type: "addActivity"; dayId: string }
  | { type: "editActivity"; dayId: string; activityId: string }
  | { type: "dayTitle"; dayId: string };

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { trips, sessionReady, loading, update, remove } = useTrips();

  const trip = trips.find((candidate) => candidate.id === id);

  const [textTarget, setTextTarget] = useState<TextTarget | null>(null);
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

  const openDayMenu = (day: TripDay, index: number) => {
    Alert.alert(day.title || defaultDayTitle(index), undefined, [
      { text: t("trips.renameDay"), onPress: () => setTextTarget({ type: "dayTitle", dayId: day.id }) },
      { text: t("trips.deleteDay"), style: "destructive", onPress: () => confirmDeleteDay(day) },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const addDay = () =>
    saveDays(trip, [...trip.days, { id: newId(), title: "", activities: [] }]);

  const handleTextSubmit = (value: string) => {
    if (!textTarget) return;
    const target = textTarget;
    setTextTarget(null);

    if (target.type === "addActivity") {
      saveDays(
        trip,
        mapDay(trip, target.dayId, (day) => ({
          ...day,
          activities: [...day.activities, { id: newId(), text: value }],
        })),
      );
    } else if (target.type === "editActivity") {
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
    return {
      title: t("trips.addActivity"),
      initialValue: "",
      placeholder: t("trips.activityPlaceholder"),
      submitLabel: t("trips.addActivity"),
      allowEmpty: false,
    };
  })();

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={t("trips.itinerary")}
        right={
          <Pressable
            onPress={openTripMenu}
            accessibilityLabel={t("trips.menuLabel")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: palette.greenSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={palette.greenText} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
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
          <TripCover
            title={trip.title}
            countryId={trip.countryId}
            markSize={64}
            style={{ width: 104, height: 104, borderRadius: 22 }}
          />
        </View>

        <View style={{ marginTop: 28 }}>
          {trip.days.length === 0 ? (
            <Text style={{ textAlign: "center", color: palette.inkMuted, marginBottom: 20 }}>
              {t("trips.noDays")}
            </Text>
          ) : null}

          {trip.days.map((day, index) => (
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
                  <Pressable onPress={() => openDayMenu(day, index)} hitSlop={10}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={palette.inkMuted} />
                  </Pressable>
                </View>

                {day.activities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    onPress={() =>
                      setTextTarget({ type: "editActivity", dayId: day.id, activityId: activity.id })
                    }
                    style={{ flexDirection: "row", gap: 8, marginTop: 10 }}
                  >
                    <Text style={{ fontSize: 14, color: palette.brand }}>•</Text>
                    <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: palette.ink }}>
                      {activity.text}
                    </Text>
                  </Pressable>
                ))}

                <Pressable
                  onPress={() => setTextTarget({ type: "addActivity", dayId: day.id })}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}
                >
                  <Ionicons name="add-circle-outline" size={18} color={palette.brand} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: palette.brand }}>
                    {t("trips.addActivity")}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
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
