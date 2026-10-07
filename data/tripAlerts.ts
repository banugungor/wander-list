import type { TranslateFn } from "@/contexts/language-context";
import type { Trip } from "@/data/trips";
import { Alert } from "react-native";

/** "Delete this trip?" confirmation, shared by the trips list and the trip
 * detail screen so the copy and flow can't drift apart. */
export function confirmDeleteTrip(t: TranslateFn, trip: Trip, onConfirm: () => void) {
  Alert.alert(
    t("trips.deleteTripTitle"),
    t("trips.deleteTripMessage", { title: trip.title }),
    [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("trips.delete"), style: "destructive", onPress: onConfirm },
    ],
  );
}

/** The ⋯ menu on a trip (edit / delete), shared like confirmDeleteTrip().
 * `onDelete` runs only after the user has confirmed. */
export function showTripMenu(
  t: TranslateFn,
  trip: Trip,
  actions: { onEdit: () => void; onDelete: () => void },
) {
  Alert.alert(trip.title, undefined, [
    { text: t("trips.editTrip"), onPress: actions.onEdit },
    {
      text: t("trips.deleteTrip"),
      style: "destructive",
      onPress: () => confirmDeleteTrip(t, trip, actions.onDelete),
    },
    { text: t("common.cancel"), style: "cancel" },
  ]);
}
