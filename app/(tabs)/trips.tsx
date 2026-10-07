import { BottomTabBar } from "@/components/bottom-tab-bar";
import { TripCover } from "@/components/trip-cover";
import { TripFormModal } from "@/components/trip-form-modal";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { canCreateTrip } from "@/data/subscription";
import { showTripMenu } from "@/data/tripAlerts";
import {
  activityCount,
  formatDateRange,
  tripPhase,
  type Trip,
  type TripDraft,
} from "@/data/trips";
import { useTrips } from "@/hooks/use-trips";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

type Filter = "all" | "upcoming" | "past";

export default function TripsScreen() {
  const { t, language } = useLanguage();
  const { trips, signedIn, sessionReady, loading, loadFailed, refresh, create, update, remove } =
    useTrips();

  const [filter, setFilter] = useState<Filter>("all");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // The hook already fetches on mount; only refetch when coming *back* to
  // this tab (e.g. after editing a trip's days on its detail screen).
  const skipFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipFirstFocus.current) {
        skipFirstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh]),
  );

  const visibleTrips = useMemo(
    () => (filter === "all" ? trips : trips.filter((trip) => tripPhase(trip) === filter)),
    [trips, filter],
  );

  // Must stay referentially stable while the form is open — the form resets
  // its fields whenever `initial` changes.
  const editInitial = useMemo<TripDraft | undefined>(
    () =>
      editingTrip
        ? {
            title: editingTrip.title,
            countryId: editingTrip.countryId,
            startDate: editingTrip.startDate,
            endDate: editingTrip.endDate,
          }
        : undefined,
    [editingTrip],
  );

  const handleNewTrip = async () => {
    // The free-trip limit counts the trips we know about. If loading failed
    // and there's no cache, that count is unknown (the user may already have
    // their free trip on the server), so don't let a retry-less offline
    // moment hand out a second free one.
    if (loadFailed && trips.length === 0) {
      Alert.alert(t("trips.loadFailedTitle"), t("trips.countUnknown"), [
        { text: t("trips.retry"), onPress: refresh },
        { text: t("common.cancel"), style: "cancel" },
      ]);
      return;
    }

    if (!(await canCreateTrip(trips.length))) {
      Alert.alert(t("trips.limitTitle"), t("trips.limitMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.unlockWithMembership"),
          onPress: () => router.push({ pathname: "/paywall", params: { category: "trips" } }),
        },
      ]);
      return;
    }
    setEditingTrip(null);
    setFormMode("create");
  };

  const handleTripMenu = (trip: Trip) =>
    showTripMenu(t, trip, {
      onEdit: () => {
        setEditingTrip(trip);
        setFormMode("edit");
      },
      onDelete: async () => {
        try {
          await remove(trip.id);
        } catch (e) {
          console.log("TRIP DELETE ERROR", e);
          Alert.alert(t("trips.deleteFailed"));
        }
      },
    });

  const handleFormSubmit = async (draft: TripDraft) => {
    if (formMode === "edit" && editingTrip) {
      await update(editingTrip.id, draft);
      return;
    }
    const created = await create(draft);
    // Navigate only once the form modal has finished dismissing — pushing a
    // screen while an iOS Modal is still on its way out can leave the new
    // screen hidden behind it.
    setTimeout(() => router.push(`/trips/${created.id}`), 450);
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("common.all") },
    { id: "upcoming", label: t("trips.filterUpcoming") },
    { id: "past", label: t("trips.filterPast") },
  ];

  const renderBody = () => {
    if (!sessionReady || (signedIn && loading)) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={palette.brand} />
        </View>
      );
    }

    if (!signedIn) {
      return (
        <CenteredMessage
          icon="cloud-done-outline"
          title={t("trips.signedOutTitle")}
          body={t("trips.signedOutBody")}
          actionLabel={t("trips.signIn")}
          onAction={() => router.push("/auth")}
        />
      );
    }

    if (loadFailed && trips.length === 0) {
      return (
        <CenteredMessage
          icon="cloud-offline-outline"
          title={t("trips.loadFailedTitle")}
          body={t("trips.loadFailedBody")}
          actionLabel={t("trips.retry")}
          onAction={refresh}
        />
      );
    }

    if (trips.length === 0) {
      return (
        <CenteredMessage
          icon="airplane-outline"
          title={t("trips.emptyTitle")}
          body={t("trips.emptyBody")}
          actionLabel={t("trips.emptyAction")}
          onAction={handleNewTrip}
        />
      );
    }

    return (
      <FlatList
        data={visibleTrips}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 110 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
            {t("trips.emptyFilter")}
          </Text>
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            language={language}
            meta={
              item.days.length > 0
                ? t("trips.cardMeta", { days: item.days.length, activities: activityCount(item) })
                : t("trips.cardMetaNoDays")
            }
            menuLabel={t("trips.menuLabel")}
            onPress={() => router.push(`/trips/${item.id}`)}
            onMenu={() => handleTripMenu(item)}
          />
        )}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 64,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>
          {t("trips.title")}
        </Text>
        {signedIn ? (
          <Pressable
            onPress={handleNewTrip}
            disabled={loading}
            accessibilityLabel={t("trips.newTrip")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: palette.brand,
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Ionicons name="add" size={24} color={palette.surface} />
          </Pressable>
        ) : null}
      </View>

      {signedIn && trips.length > 0 ? (
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: 16, marginBottom: 14 }}>
          {filters.map(({ id, label }) => {
            const active = filter === id;
            return (
              <Pressable
                key={id}
                onPress={() => setFilter(id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: active ? palette.brand : palette.creamDeep,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: active ? palette.surface : palette.inkMuted,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ height: 16 }} />
      )}

      {renderBody()}

      <TripFormModal
        visible={formMode !== null}
        mode={formMode ?? "create"}
        initial={formMode === "edit" ? editInitial : undefined}
        onClose={() => setFormMode(null)}
        onSubmit={handleFormSubmit}
      />

      <BottomTabBar />
    </View>
  );
}

function TripCard({
  trip,
  language,
  meta,
  menuLabel,
  onPress,
  onMenu,
}: {
  trip: Trip;
  language: "tr" | "en";
  meta: string;
  menuLabel: string;
  onPress: () => void;
  onMenu: () => void;
}) {
  const dates = formatDateRange(trip.startDate, trip.endDate, language);

  return (
    <Pressable onPress={onPress} style={{ marginHorizontal: 16, marginBottom: 14 }}>
      <TripCover
        title={trip.title}
        countryId={trip.countryId}
        style={{ height: 170, borderRadius: 24, justifyContent: "flex-end" }}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.35)"]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 100 }}
        />
        <View style={{ padding: 18, paddingRight: 64 }}>
          <Text
            numberOfLines={2}
            style={{ fontSize: 22, fontWeight: "700", color: palette.onDark }}
          >
            {trip.title}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: palette.onDark, opacity: 0.9 }}>
            {dates ? `${dates} · ${meta}` : meta}
          </Text>
        </View>
        <Pressable
          onPress={onMenu}
          hitSlop={8}
          accessibilityLabel={menuLabel}
          style={{
            position: "absolute",
            right: 14,
            bottom: 14,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.3)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={palette.onDark} />
        </Pressable>
      </TripCover>
    </Pressable>
  );
}

function CenteredMessage({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, paddingBottom: 90 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: palette.greenSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={32} color={palette.brand} />
      </View>
      <Text style={{ marginTop: 18, fontSize: 18, fontWeight: "700", color: palette.ink, textAlign: "center" }}>
        {title}
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 20, color: palette.inkMuted, textAlign: "center" }}>
        {body}
      </Text>
      <Pressable
        onPress={onAction}
        style={{
          marginTop: 22,
          paddingHorizontal: 26,
          height: 48,
          borderRadius: 24,
          backgroundColor: palette.brand,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
