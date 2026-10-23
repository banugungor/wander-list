// Pure helpers for the small profile-only values that ride along in the
// `user_backups.profile_extras` jsonb column (see data/cloudSync.ts): the badge
// showcase and the year each country was visited. Kept free of AsyncStorage /
// cloudSync imports so both the storage modules and cloudSync can use them
// without an import cycle.

export const SHOWCASE_SIZE = 3;
export const MIN_VISIT_YEAR = 1950;

/** country id -> year it was visited. */
export type CountryYears = Record<string, number>;

export type ProfileExtras = {
  badge_showcase: string[];
  country_years: CountryYears;
};

/** JSON.parse that returns null instead of throwing on a missing or
 * malformed string (AsyncStorage values and cloud payloads are untrusted). */
export function parseJsonSafe(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function sanitizeShowcase(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter(
    (id): id is string => typeof id === "string" && id !== "",
  );
  return Array.from(new Set(ids)).slice(0, SHOWCASE_SIZE);
}

export function sanitizeCountryYears(value: unknown): CountryYears {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const maxYear = new Date().getFullYear();
  const result: CountryYears = {};
  for (const [id, year] of Object.entries(value as Record<string, unknown>)) {
    if (
      typeof year === "number" &&
      Number.isInteger(year) &&
      year >= MIN_VISIT_YEAR &&
      year <= maxYear
    ) {
      result[id] = year;
    }
  }
  return result;
}
