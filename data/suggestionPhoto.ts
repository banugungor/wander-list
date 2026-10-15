import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

/** A photo chosen for a suggestion, already shrunk and re-encoded as JPEG. */
export type SuggestionPhoto = {
  /** Local file of the shrunk copy — for the form's preview. */
  uri: string;
  /** Its JPEG bytes, base64-encoded — what gets uploaded. */
  base64: string;
};

/** Longest side, in px, of the uploaded copy. Phone photos are 4000+ px and
 * several MB; the founder only needs enough to judge and re-use them. */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

/** The `suggestion-images` bucket rejects files above this
 * (scripts/suggestion_images_bucket.sql). A 1600px JPEG is ~0.3–1 MB, so
 * this only trips if the shrink somehow didn't happen. */
export const MAX_SUGGESTION_PHOTO_BYTES = 5 * 1024 * 1024;

export class SuggestionPhotoTooLargeError extends Error {}

/** Opens the photo library (single pick, no camera) and returns a shrunk
 * JPEG copy, or null if the user backed out. The system picker needs no
 * photo-library permission on iOS 14+ / Android 13+. */
export async function pickSuggestionPhoto(): Promise<SuggestionPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: false,
    quality: 1,
  });
  const asset = result.canceled ? null : result.assets?.[0];
  if (!asset) return null;

  // Never upscale a small image.
  let context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_DIMENSION) {
    context = context.resize(
      asset.width >= asset.height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION },
    );
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });
  if (!saved.base64) throw new Error("Image manipulator returned no base64 data");
  if ((saved.base64.length * 3) / 4 > MAX_SUGGESTION_PHOTO_BYTES) {
    throw new SuggestionPhotoTooLargeError();
  }
  return { uri: saved.uri, base64: saved.base64 };
}
