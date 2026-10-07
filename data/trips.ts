import AsyncStorage from "@react-native-async-storage/async-storage";
import { TRIPS_CACHE_KEY_PREFIX } from "@/data/storageKeys";
import worldData from "@/data/worldCountries.json";
import { supabase } from "@/lib/supabase";

export type TripActivity = { id: string; text: string };
export type TripDay = { id: string; title: string; activities: TripActivity[] };

export type Trip = {
  id: string;
  title: string;
  /** `id` from data/worldCountries.json, only used to show a flag. */
  countryId: string | null;
  /** "YYYY-MM-DD", local calendar date. */
  startDate: string | null;
  endDate: string | null;
  days: TripDay[];
  updatedAt: string;
};

/** The fields a user fills in on the create/edit form. */
export type TripDraft = Pick<Trip, "title" | "countryId" | "startDate" | "endDate">;

type TripRow = {
  id: string;
  title: string;
  country_id: string | null;
  start_date: string | null;
  end_date: string | null;
  days: unknown;
  updated_at: string;
};

/** A trip with dates longer than this only gets this many empty days
 * pre-created — keeps a typo'd end date (year 2099) from creating
 * thousands of days. The user can still add more by hand. */
export const MAX_AUTO_DAYS = 60;

export const MAX_TITLE_LENGTH = 120;

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** `days` is untyped jsonb coming from the database or from AsyncStorage —
 * never trust its shape. Anything malformed is dropped or defaulted instead
 * of throwing, so a bad row can't crash the screen. */
export function normalizeDays(raw: unknown): TripDay[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter(isRecord).map((day) => ({
    id: typeof day.id === "string" && day.id ? day.id : newId(),
    title: typeof day.title === "string" ? day.title : "",
    activities: Array.isArray(day.activities)
      ? day.activities.filter(isRecord).map((activity) => ({
          id:
            typeof activity.id === "string" && activity.id
              ? activity.id
              : newId(),
          text: typeof activity.text === "string" ? activity.text : "",
        }))
      : [],
  }));
}

function fromRow(row: TripRow): Trip {
  return {
    id: row.id,
    title: row.title,
    countryId: row.country_id,
    startDate: row.start_date,
    endDate: row.end_date,
    days: normalizeDays(row.days),
    updatedAt: row.updated_at,
  };
}

// ---------- dates ----------

/** Local-time "YYYY-MM-DD" (not toISOString, which shifts to UTC and can
 * land on the previous day for users east of Greenwich). */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Returns null for anything that isn't a real "YYYY-MM-DD" date. */
export function parseDateKey(key: string | null | undefined): Date | null {
  if (!key) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Inclusive number of calendar days from start to end (1 for the same day),
 * or 0 if either date is missing/invalid or end is before start. */
export function inclusiveDayCount(
  startDate: string | null,
  endDate: string | null,
): number {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || end < start) return 0;
  // Compare as UTC midnights so a daylight-saving change inside the range
  // can't make a day count come out one short or long.
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000) + 1;
}

/** "12 May – 18 May 2026" style label, or null when the trip has no valid
 * start date. The year is dropped from the start when both dates share it. */
export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  language: "tr" | "en",
): string | null {
  const start = parseDateKey(startDate);
  if (!start) return null;
  const end = parseDateKey(endDate);
  const locale = language === "tr" ? "tr-TR" : "en-GB";

  const withYear = (date: Date) =>
    date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  const withoutYear = (date: Date) =>
    date.toLocaleDateString(locale, { day: "numeric", month: "short" });

  if (!end) return withYear(start);
  const startLabel =
    start.getFullYear() === end.getFullYear() ? withoutYear(start) : withYear(start);
  return `${startLabel} – ${withYear(end)}`;
}

type WorldCountry = { id: string; name: string; iso2: string };

export function findCountry(countryId: string | null): WorldCountry | undefined {
  if (!countryId) return undefined;
  return (worldData.countries as WorldCountry[]).find((c) => c.id === countryId);
}

export function emptyDays(count: number): TripDay[] {
  return Array.from({ length: Math.min(Math.max(count, 0), MAX_AUTO_DAYS) }, () => ({
    id: newId(),
    title: "",
    activities: [],
  }));
}

export function activityCount(trip: Trip): number {
  return trip.days.reduce((sum, day) => sum + day.activities.length, 0);
}

export type TripPhase = "upcoming" | "past";

/** A trip is "past" once its end date (or, with no end date, its start date)
 * is before today. Trips with no dates at all are still being planned, so
 * they count as upcoming. */
export function tripPhase(trip: Trip, today: Date = new Date()): TripPhase {
  const last = parseDateKey(trip.endDate) ?? parseDateKey(trip.startDate);
  if (!last) return "upcoming";
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return last < todayStart ? "past" : "upcoming";
}

// ---------- offline read cache ----------

// Keyed by user id so a second account signing in on the same device never
// sees the first account's trips.
const cacheKey = (userId: string) => `${TRIPS_CACHE_KEY_PREFIX}${userId}`;

function toRow(trip: Trip): TripRow {
  return {
    id: trip.id,
    title: trip.title,
    country_id: trip.countryId,
    start_date: trip.startDate,
    end_date: trip.endDate,
    days: trip.days,
    updated_at: trip.updatedAt,
  };
}

// The cache stores the same row shape the server returns (toRow/fromRow are
// the only two mappings), so a field added to Trip can't be silently dropped
// from offline reads.
export async function readTripsCache(userId: string): Promise<Trip[]> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is TripRow =>
          isRecord(item) &&
          typeof item.id === "string" &&
          item.id !== "" &&
          typeof item.title === "string" &&
          item.title !== "",
      )
      .map(fromRow);
  } catch {
    return [];
  }
}

export async function writeTripsCache(userId: string, trips: Trip[]): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(trips.map(toRow)));
  } catch (e) {
    console.log("TRIPS CACHE WRITE ERROR", e);
  }
}

/** Removes a user's offline copy — on sign-out and account deletion, so a
 * shared or handed-on device doesn't keep someone's trip plans around. */
export async function clearTripsCache(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(cacheKey(userId));
  } catch (e) {
    console.log("TRIPS CACHE CLEAR ERROR", e);
  }
}

// ---------- Supabase ----------

// One write at a time per trip. Every edit sends the whole `days` array from
// the latest local state, so if two writes were in flight and the older one
// landed last it would silently undo the newer edit.
const writeQueues = new Map<string, Promise<unknown>>();

/** Resolves once every queued trip write has settled (success or failure). */
function waitForPendingWrites(): Promise<unknown> {
  return Promise.all([...writeQueues.values()]);
}

export async function fetchTrips(): Promise<Trip[]> {
  // A fetch that starts while an edit is still being saved would read the
  // pre-edit row and then overwrite the screen with stale data (e.g. the list
  // refetching right after leaving a trip's detail screen).
  await waitForPendingWrites();
  const { data, error } = await supabase
    .from("trips")
    .select("id,title,country_id,start_date,end_date,days,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as TripRow[]).map(fromRow);
}

export async function createTrip(
  userId: string,
  draft: TripDraft,
  days: TripDay[],
): Promise<Trip> {
  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: userId,
      title: draft.title,
      country_id: draft.countryId,
      start_date: draft.startDate,
      end_date: draft.endDate,
      days,
    })
    .select("id,title,country_id,start_date,end_date,days,updated_at")
    .single();
  if (error) throw error;
  return fromRow(data as TripRow);
}

export type TripPatch = Partial<
  Pick<Trip, "title" | "countryId" | "startDate" | "endDate" | "days">
>;

export function updateTrip(id: string, patch: TripPatch): Promise<Trip> {
  const body: Record<string, unknown> = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.countryId !== undefined) body.country_id = patch.countryId;
  if (patch.startDate !== undefined) body.start_date = patch.startDate;
  if (patch.endDate !== undefined) body.end_date = patch.endDate;
  if (patch.days !== undefined) body.days = patch.days;

  const run = async (): Promise<Trip> => {
    const { data, error } = await supabase
      .from("trips")
      .update(body)
      .eq("id", id)
      .select("id,title,country_id,start_date,end_date,days,updated_at")
      .single();
    if (error) throw error;
    return fromRow(data as TripRow);
  };

  const previous = writeQueues.get(id) ?? Promise.resolve();
  const next = previous.then(run, run);
  // Keep the chain alive after a failure so one error doesn't block later writes.
  writeQueues.set(
    id,
    next.catch(() => undefined),
  );
  return next;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
  writeQueues.delete(id);
}
