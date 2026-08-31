import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, type CustomerInfo } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

/** The RevenueCat entitlement identifier that gates the Islands category.
 * Must match the entitlement configured in the RevenueCat dashboard
 * (Project → Entitlements), which in turn is attached to the yearly
 * subscription product created in App Store Connect / Play Console. */
export const ISLANDS_ENTITLEMENT_ID = "islands_premium";

/** The RevenueCat entitlement identifier that unlocks every paid category
 * (Islands today, future paid categories like bike routes later). A yearly
 * membership product should be attached to this entitlement in the
 * RevenueCat dashboard in addition to (or instead of) the per-category one,
 * so a member holding this is treated as unlocked everywhere without each
 * per-category check needing to know about every other paid category. */
export const ALL_ACCESS_ENTITLEMENT_ID = "all_access_premium";

let configured = false;

/** Configures the RevenueCat SDK once per app launch. Safe to call multiple
 * times — subsequent calls are no-ops. Call this as early as possible (see
 * app/_layout.tsx) so entitlement checks elsewhere never race against an
 * unconfigured SDK. */
export function configurePurchases(): void {
  if (configured) return;
  if (!REVENUECAT_API_KEY) {
    console.log("REVENUECAT: EXPO_PUBLIC_REVENUECAT_API_KEY is not set, skipping configure");
    return;
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  configured = true;
}

function hasEntitlement(info: CustomerInfo, entitlementId: string): boolean {
  return (
    info.entitlements.active[entitlementId] !== undefined ||
    info.entitlements.active[ALL_ACCESS_ENTITLEMENT_ID] !== undefined
  );
}

/** Whether a paid category is unlocked for the current device, per
 * RevenueCat's cached customer info — true if the device holds either that
 * category's own entitlement or the all-access one. Returns false (locked)
 * if the SDK isn't configured or the check fails — callers should treat
 * that as "show the paywall", never as "grant access". */
export async function isCategoryUnlocked(entitlementId: string): Promise<boolean> {
  if (!configured) return false;

  try {
    const info = await Purchases.getCustomerInfo();
    return hasEntitlement(info, entitlementId);
  } catch (e) {
    console.log("REVENUECAT: getCustomerInfo failed", e);
    return false;
  }
}

/** Whether the Islands category is unlocked for the current device. Thin
 * wrapper over isCategoryUnlocked() kept for callers that only ever deal
 * with Islands. */
export async function isIslandsUnlocked(): Promise<boolean> {
  return isCategoryUnlocked(ISLANDS_ENTITLEMENT_ID);
}

/** The RevenueCat Offering identifier that carries the Islands-specific
 * paywall design/copy ("Make Every Journey Count" etc). Must match an
 * Offering created in the RevenueCat dashboard (Product catalog →
 * Offerings) with the Islands paywall attached and the Islands products
 * added as packages. Each future paid category (e.g. bike routes) should
 * get its own Offering + paywall rather than reusing this one, since the
 * design/copy won't make sense for a different category. */
export const ISLANDS_OFFERING_ID = "island_offering";

/** Presents the RevenueCat paywall UI for a specific Offering (its design is
 * whatever's configured for that Offering in the dashboard), only if
 * `entitlementId` isn't already active, then re-checks entitlement so
 * callers get an up-to-date unlocked state right after the sheet closes (a
 * purchase, a restore, or a dismiss without buying). Falls back to the
 * dashboard's "current" offering if `offeringId` can't be found, so a typo
 * or not-yet-created Offering degrades to *a* paywall rather than none. */
export async function presentPaywallForCategory(
  offeringId: string,
  entitlementId: string,
): Promise<boolean> {
  if (!configured) return false;

  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.all[offeringId] ?? offerings.current ?? undefined;
    await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: entitlementId,
      offering,
    });
  } catch (e) {
    console.log("REVENUECAT: presentPaywallIfNeeded failed", e);
  }

  return isCategoryUnlocked(entitlementId);
}

/** Presents the Islands paywall. Thin wrapper over
 * presentPaywallForCategory() kept for callers that only ever deal with
 * Islands. */
export async function presentIslandsPaywall(): Promise<boolean> {
  return presentPaywallForCategory(ISLANDS_OFFERING_ID, ISLANDS_ENTITLEMENT_ID);
}

/** Ties the RevenueCat customer id to the signed-in Supabase user, so
 * purchases made while signed in are attributed to that account rather than
 * an anonymous device id. Call after sign-in/sign-up alongside
 * syncAfterAuth() (see data/cloudSync.ts). No-op if not configured. */
export async function loginPurchases(userId: string): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.log("REVENUECAT: logIn failed", e);
  }
}

/** Detaches the RevenueCat customer id back to an anonymous one on sign-out.
 * No-op if not configured. */
export async function logoutPurchases(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    console.log("REVENUECAT: logOut failed", e);
  }
}

// Re-exported so callers don't need to import react-native directly just to
// branch on platform for store-specific copy (e.g. "App Store" vs "Play
// Store" in paywall text).
export const isIOS = Platform.OS === "ios";
