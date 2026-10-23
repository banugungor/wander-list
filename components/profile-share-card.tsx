import { ShareIdentityCard } from "@/components/share-identity-card";
import { SharePassportCard } from "@/components/share-passport-card";
import { ShareStoryCard } from "@/components/share-story-card";
import { ShareWorldCard } from "@/components/share-world-card";
import { ShareYearCard } from "@/components/share-year-card";
import { useLanguage } from "@/contexts/language-context";
import { getTotalContinentCount } from "@/data/continents";
import { getWorldCountry, type WorldCountry } from "@/data/countryLookup";
import type { CountryYears } from "@/data/profileExtras";
import { buildTravelTimeline } from "@/data/travelTimeline";
import worldData from "@/data/worldCountries.json";
import { forwardRef } from "react";
import type { View } from "react-native";

export type ShareCardId = "identity" | "passport" | "year" | "world" | "stats";

/** Everything any profile share card needs, gathered once by the profile screen. */
export type ProfileShareData = {
  name: string;
  titleKey: string | null;
  home: WorldCountry | undefined;
  /** Visited country ids in marking order (oldest first, as stored). */
  placesIds: string[];
  years: CountryYears;
  continents: number;
  heritage: number;
  cuisine: number;
  islands: number;
  /** The year the "year" card shows. */
  year: number | null;
};

/** The cards worth offering right now, in picker order: cards about countries
 * or years are left out while there is nothing to show. */
export function availableShareCards(data: ProfileShareData): ShareCardId[] {
  const hasCountries = data.placesIds.length > 0;
  const hasYears = buildTravelTimeline(data.placesIds, data.years).years.length > 0;
  const ids: ShareCardId[] = ["identity"];
  if (hasCountries) ids.push("passport");
  if (hasYears) ids.push("year");
  if (hasCountries) ids.push("world");
  ids.push("stats");
  return ids;
}

type Props = { id: ShareCardId; data: ProfileShareData };

/** Renders one of the profile's share cards by id. With a `ref` it is the copy
 * that gets captured; without one it is a preview. */
export const ProfileShareCard = forwardRef<View, Props>(
  function ProfileShareCard({ id, data }, ref) {
    const { t } = useLanguage();

    switch (id) {
      case "identity":
        return (
          <ShareIdentityCard
            ref={ref}
            name={data.name}
            titleKey={data.titleKey}
            home={data.home}
            countries={data.placesIds.length}
            continents={data.continents}
            heritage={data.heritage}
            cuisine={data.cuisine}
          />
        );
      case "passport":
        return (
          <SharePassportCard ref={ref} visitedIds={data.placesIds} years={data.years} />
        );
      case "year": {
        const group = buildTravelTimeline(data.placesIds, data.years).years.find(
          (g) => g.year === data.year,
        );
        return (
          <ShareYearCard
            ref={ref}
            year={group?.year ?? data.year ?? new Date().getFullYear()}
            countries={group?.countries ?? []}
          />
        );
      }
      case "world":
        return (
          <ShareWorldCard
            ref={ref}
            visitedCount={data.placesIds.length}
            totalCount={worldData.countries.length}
            continentCount={data.continents}
            totalContinents={getTotalContinentCount()}
            flags={data.placesIds
              .slice()
              .reverse()
              .map((cid) => getWorldCountry(cid))
              .filter((c): c is WorldCountry => !!c)
              .map((c) => ({ id: c.id, iso2: c.iso2 }))}
          />
        );
      case "stats":
        return (
          <ShareStoryCard
            ref={ref}
            heritageCount={data.heritage}
            placesCount={data.placesIds.length}
            cuisineCount={data.cuisine}
            islandsCount={data.islands}
            title={t("stats.shareCardTitle")}
            footer={t("stats.shareCardFooter")}
          />
        );
    }
  },
);
