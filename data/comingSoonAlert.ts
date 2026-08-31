import type { TranslateFn } from "@/contexts/language-context";
import { Alert } from "react-native";

/** Shared "this category isn't ready yet" alert — used by both the add-category
 * modal (implemented: false categories) and the home screen's coming-soon
 * teaser row (categories not even in constants/categories.ts yet). */
export function showComingSoonAlert(t: TranslateFn): void {
  Alert.alert(t("modal.comingSoonAlertTitle"), t("modal.comingSoonAlertMessage"));
}
