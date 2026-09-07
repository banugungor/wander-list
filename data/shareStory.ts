import { palette } from "@/constants/palette";
import type { RefObject } from "react";
import { Linking, Platform, type View } from "react-native";
import * as Sharing from "expo-sharing";
import { captureRef, releaseCapture } from "react-native-view-shot";

// Used as react-native-share's required `appId` (the `source_application`
// value on iOS's pasteboard / Android's share intent) — this is NOT a
// Facebook App ID, we don't have one configured (see CLAUDE.md). It only
// unlocks the "swipe up to open app" attribution link, which needs a real
// Facebook App ID to work anyway; passing the bundle id still lets the
// plain background-image share work today. iOS and Android use different
// ids (app.json's ios.bundleIdentifier vs android.package), so this must
// match whichever platform is sharing.
const INSTAGRAM_SOURCE_APPLICATION =
  Platform.OS === "ios" ? "com.wanderlistapp.ios" : "com.wanderlist.app";

// react-native-share has no web implementation — it calls
// TurboModuleRegistry.getEnforcing() at module load, which throws
// immediately on web. `npm run web` statically prerenders every route
// (app.json's `web.output: "static"`), so a top-level import of this
// package anywhere in the route tree would break the web build entirely,
// not just this screen. Load it lazily, and only on native platforms.
async function loadShare() {
  const mod = await import("react-native-share");
  return { Share: mod.default, Social: mod.Social };
}

async function isInstagramInstalled(share: Awaited<ReturnType<typeof loadShare>>): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      const result = await share.Share.isPackageInstalled("com.instagram.android");
      return result.isInstalled;
    } catch {
      return false;
    }
  }
  try {
    return await Linking.canOpenURL("instagram-stories://share");
  } catch {
    return false;
  }
}

// captureRef's tmpfiles are only cleaned up when the app process exits, so a
// session with several shares would otherwise accumulate one orphaned PNG
// per tap. Releasing the *previous* capture right before making a new one
// (rather than the current one right after sharing it) avoids racing the
// delete against Instagram/the share sheet still reading the file.
let lastCaptureUri: string | null = null;

/**
 * Captures `cardRef` (a `ShareStoryCard`, rendered off-screen) to a PNG and
 * shares it as an Instagram Story background image. Falls back to the
 * generic OS share sheet (`expo-sharing`) when Instagram isn't installed or
 * the Stories share itself fails/is cancelled.
 */
export async function shareStatsToInstagramStory(
  cardRef: RefObject<View | null>,
): Promise<void> {
  if (lastCaptureUri) {
    releaseCapture(lastCaptureUri);
  }

  const uri = await captureRef(cardRef, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    width: 1080,
    height: 1920,
  });
  lastCaptureUri = uri;

  if (Platform.OS !== "web") {
    const share = await loadShare();
    if (await isInstagramInstalled(share)) {
      try {
        await share.Share.shareSingle({
          social: share.Social.InstagramStories,
          appId: INSTAGRAM_SOURCE_APPLICATION,
          backgroundImage: uri,
          backgroundTopColor: palette.cardDarkFrom,
          backgroundBottomColor: palette.cardDarkTo,
        });
        return;
      } catch (e) {
        // User cancelled, or the native share itself failed — fall through
        // to the generic share sheet below rather than surfacing an error.
        console.log("INSTAGRAM STORY SHARE ERROR", e);
      }
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}
