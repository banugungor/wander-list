import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export type CuisineMeal = {
  id: string;
  countryId: string;
  name: string;
  nameTr: string | null;
  city: string | null;
  cityTr: string | null;
  description: string | null;
  descriptionTr: string | null;
  imageUrl: string | null;
};

type MealRow = {
  id: number;
  country_id: string;
  name: string;
  name_tr: string | null;
  city: string | null;
  city_tr: string | null;
  description: string | null;
  description_tr: string | null;
  image_url: string | null;
};

function fromRow(row: MealRow): CuisineMeal {
  return {
    id: String(row.id),
    countryId: row.country_id,
    name: row.name,
    nameTr: row.name_tr,
    city: row.city,
    cityTr: row.city_tr,
    description: row.description,
    descriptionTr: row.description_tr,
    imageUrl: row.image_url,
  };
}

export function localizedMealName(meal: CuisineMeal, language: "tr" | "en"): string {
  return (language === "tr" && meal.nameTr) || meal.name;
}

export function localizedMealCity(
  meal: CuisineMeal,
  language: "tr" | "en",
): string | null {
  return (language === "tr" && meal.cityTr) || meal.city;
}

export function localizedMealDescription(
  meal: CuisineMeal,
  language: "tr" | "en",
): string | null {
  return (language === "tr" && meal.descriptionTr) || meal.description;
}

const MEALS_CACHE_PREFIX = "cuisine_meals_";
const INDEX_CACHE_KEY = "cuisine_meal_index";

async function getCachedMeals(countryId: string): Promise<CuisineMeal[] | null> {
  const raw = await AsyncStorage.getItem(MEALS_CACHE_PREFIX + countryId);
  return raw ? JSON.parse(raw) : null;
}

/** Live-fetches a country's meal list from Supabase and refreshes the local
 * cache. Throws on failure — callers fall back to the cache (see
 * useCountryMeals) rather than surfacing this to the user. */
export async function fetchMealsForCountry(countryId: string): Promise<CuisineMeal[]> {
  const { data, error } = await supabase
    .from("cuisine_meals")
    .select("*")
    .eq("country_id", countryId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const meals = (data as MealRow[]).map(fromRow);
  await AsyncStorage.setItem(MEALS_CACHE_PREFIX + countryId, JSON.stringify(meals));
  return meals;
}

export type CuisineMealIndex = {
  /** country id -> how many meals exist for it. */
  counts: Record<string, number>;
  /** meal id -> the country id it belongs to, for turning a local list of
   * tasted meal ids into a per-country/per-continent tasted count without an
   * extra round trip per screen. */
  countryByMealId: Record<string, string>;
};

async function getCachedMealIndex(): Promise<CuisineMealIndex | null> {
  const raw = await AsyncStorage.getItem(INDEX_CACHE_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Live-fetches every meal's (id, country_id) in one round trip — used by
 * the continent/country picker for per-row and overall totals. */
export async function fetchMealIndex(): Promise<CuisineMealIndex> {
  const { data, error } = await supabase.from("cuisine_meals").select("id, country_id");
  if (error) throw error;

  const counts: Record<string, number> = {};
  const countryByMealId: Record<string, string> = {};
  for (const row of data as { id: number; country_id: string }[]) {
    counts[row.country_id] = (counts[row.country_id] ?? 0) + 1;
    countryByMealId[String(row.id)] = row.country_id;
  }

  const index: CuisineMealIndex = { counts, countryByMealId };
  await AsyncStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(index));
  return index;
}

/** Turns a local list of tasted meal ids into a per-country tally, using the
 * id -> country_id map from fetchMealIndex/getCachedMealIndex. */
export function tastedCountByCountry(
  visitedMealIds: string[],
  countryByMealId: Record<string, string>,
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const mealId of visitedMealIds) {
    const countryId = countryByMealId[mealId];
    if (countryId) tally[countryId] = (tally[countryId] ?? 0) + 1;
  }
  return tally;
}

export { getCachedMeals, getCachedMealIndex };
