import { supabase } from "@/lib/supabase";

/** The categories a user can suggest content for. Heritage (UNESCO list,
 * bundled with the app) and Places (fixed country list) aren't suggestable. */
export type SuggestionCategory = "landmarks" | "cuisine" | "islands";

export type SuggestionDraft = {
  category: SuggestionCategory;
  /** `id` from data/worldCountries.json. */
  countryId: string;
  name: string;
  /** Landmarks: its city. Cuisine: city/region. Not used for islands. */
  city: string | null;
  description: string | null;
};

export const MAX_SUGGESTION_NAME_LENGTH = 120;
export const MAX_SUGGESTION_CITY_LENGTH = 120;
export const MAX_SUGGESTION_DESCRIPTION_LENGTH = 1000;

/** Version of the consent text shown in the suggestion form
 * (`suggest.consent*` in constants/translations.ts). Stored with each
 * suggestion — bump it whenever that wording changes. */
export const SUGGESTION_TERMS_VERSION = 1;

/** Thrown when the per-user daily cap (trigger in
 * scripts/suggestions_schema.sql) rejects the insert. */
export class SuggestionLimitError extends Error {}

/** Whether the form asks for a city/region for this category. */
export function suggestionHasCity(category: SuggestionCategory): boolean {
  return category !== "islands";
}

/** Inserts a 'pending' suggestion for the signed-in user. Write-only: the
 * app can't read suggestions back (RLS, see scripts/suggestions_schema.sql).
 * Throws if signed out, offline, or over the daily limit. */
export async function submitSuggestion(draft: SuggestionDraft): Promise<void> {
  const { error } = await supabase.from("suggestions").insert({
    category: draft.category,
    country_id: draft.countryId,
    name: draft.name,
    city: draft.city,
    description: draft.description,
    terms_version: SUGGESTION_TERMS_VERSION,
  });

  if (error) {
    if (error.message.includes("suggestion limit")) throw new SuggestionLimitError();
    throw error;
  }
}
