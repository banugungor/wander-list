import type { SuggestionPhoto } from "@/data/suggestionPhoto";
import { supabase } from "@/lib/supabase";
import { toByteArray } from "base64-js";

/** What a user can send us. Landmarks/cuisine/islands suggest a new entry
 * for a country. `heritage_photo` is the odd one out: Heritage is the bundled
 * UNESCO list (nothing to add), so the only thing to contribute there is a
 * photo for a site that has none. Places (fixed country list) isn't
 * suggestable. */
export type SuggestionCategory = "landmarks" | "cuisine" | "islands" | "heritage_photo";

export type SuggestionDraft = {
  category: SuggestionCategory;
  /** `id` from data/worldCountries.json. Null for `heritage_photo`. */
  countryId: string | null;
  /** `heritage_photo` only: id of the bundled site (data/heritageSites.json). */
  heritageSiteId?: string | null;
  /** Landmarks/cuisine/islands only: set when the photo is for an entry that
   * already exists (its row id), instead of proposing a new one. `name` is
   * then that entry's English name. */
  targetId?: string | null;
  /** For `heritage_photo`, the site's English name (so the admin panel can
   * show which site it is). */
  name: string;
  /** Landmarks: its city. Cuisine: city/region. Not used for islands. */
  city: string | null;
  description: string | null;
  /** One optional photo (required for `heritage_photo`). */
  photo?: SuggestionPhoto | null;
};

export const MAX_SUGGESTION_NAME_LENGTH = 120;
export const MAX_SUGGESTION_CITY_LENGTH = 120;
export const MAX_SUGGESTION_DESCRIPTION_LENGTH = 1000;

/** Version of the consent text shown in the suggestion form
 * (`suggest.consent*` in constants/translations.ts). Stored with each
 * suggestion — bump it whenever that wording changes. */
export const SUGGESTION_TERMS_VERSION = 2;

/** Private bucket the suggestion photos go to — users can only upload into
 * their own `<user_id>/` folder (scripts/suggestion_images_bucket.sql). */
const SUGGESTION_IMAGES_BUCKET = "suggestion-images";

/** Thrown when the per-user daily cap (trigger in
 * scripts/suggestions_schema.sql) rejects the insert. */
export class SuggestionLimitError extends Error {}

/** Whether the form asks for a city/region for this category. */
export function suggestionHasCity(category: SuggestionCategory): boolean {
  return category === "landmarks" || category === "cuisine";
}

/** Uploads the photo into the sender's own folder and returns its storage
 * path (what `suggestions.image_path` stores). */
async function uploadSuggestionPhoto(photo: SuggestionPhoto): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Not signed in");

  const path = `${userData.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error } = await supabase.storage
    .from(SUGGESTION_IMAGES_BUCKET)
    .upload(path, toByteArray(photo.base64), { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

/** Uploads the photo (if any), then inserts a 'pending' suggestion for the
 * signed-in user. Write-only: the app can't read suggestions back (RLS, see
 * scripts/suggestions_schema.sql). Throws if signed out, offline, or over the
 * daily limit. */
export async function submitSuggestion(draft: SuggestionDraft): Promise<void> {
  const imagePath = draft.photo ? await uploadSuggestionPhoto(draft.photo) : null;

  const { error } = await supabase.from("suggestions").insert({
    category: draft.category,
    country_id: draft.countryId,
    heritage_site_id: draft.heritageSiteId ?? null,
    target_id: draft.targetId ?? null,
    name: draft.name,
    city: draft.city,
    description: draft.description,
    image_path: imagePath,
    terms_version: SUGGESTION_TERMS_VERSION,
  });

  if (error) {
    // A rejected insert (e.g. over the daily cap) leaves the already
    // uploaded photo orphaned: users have no delete policy on the bucket.
    // Accepted — it's one small file per rejected attempt, only reachable
    // by signed-in users, and the admin can clear the bucket.
    if (error.message.includes("suggestion limit")) throw new SuggestionLimitError();
    throw error;
  }
}
