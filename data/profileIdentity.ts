import { getWorldCountry, type WorldCountry } from "@/data/countryLookup";
import type { User } from "@supabase/supabase-js";

function metaString(user: User | null | undefined, key: string): string {
  const value = user?.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

/** Name and home country shown on the profile and its share cards. Read from
 * the sign-up fields in `user_metadata` (type-guarded: it's untyped JSON). */
export function getProfileIdentity(
  user: User | null | undefined,
  guestName: string,
): { displayName: string; home: WorldCountry | undefined } {
  const fullName = [metaString(user, "first_name"), metaString(user, "last_name")]
    .filter(Boolean)
    .join(" ");
  const homeId = metaString(user, "country_id");
  return {
    displayName: fullName || user?.email?.split("@")[0] || guestName,
    home: homeId ? getWorldCountry(homeId) : undefined,
  };
}
