import type { CategoryId } from "@/constants/categories";
import { getVisitedContinents, getTotalContinentCount } from "@/data/continents";
import worldData from "@/data/worldCountries.json";

export type Badge = {
  id: string;
  categoryId: CategoryId;
  /** Key into translations.ts under `badge.*` — resolve with t(titleKey). */
  titleKey: string;
  earned: boolean;
  current: number;
  target: number;
};

export type BadgeContext = {
  heritageVisitedCount: number;
  heritageTotal: number;
  countriesVisitedIds: string[];
};

type BadgeDefinition = {
  id: string;
  categoryId: CategoryId;
  titleKey: string;
  current: (ctx: BadgeContext) => number;
  target: (ctx: BadgeContext) => number;
};

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Dünya Mirası
  {
    id: "heritage_5",
    categoryId: "heritage",
    titleKey: "badge.heritage_5",
    current: (ctx) => ctx.heritageVisitedCount,
    target: () => 5,
  },
  {
    id: "heritage_25",
    categoryId: "heritage",
    titleKey: "badge.heritage_25",
    current: (ctx) => ctx.heritageVisitedCount,
    target: () => 25,
  },
  {
    id: "heritage_100",
    categoryId: "heritage",
    titleKey: "badge.heritage_100",
    current: (ctx) => ctx.heritageVisitedCount,
    target: () => 100,
  },
  {
    id: "heritage_all",
    categoryId: "heritage",
    titleKey: "badge.heritage_all",
    current: (ctx) => ctx.heritageVisitedCount,
    target: (ctx) => ctx.heritageTotal,
  },

  // Ülkeler
  {
    id: "places_10",
    categoryId: "places",
    titleKey: "badge.places_10",
    current: (ctx) => ctx.countriesVisitedIds.length,
    target: () => 10,
  },
  {
    id: "places_50",
    categoryId: "places",
    titleKey: "badge.places_50",
    current: (ctx) => ctx.countriesVisitedIds.length,
    target: () => 50,
  },
  {
    id: "places_100",
    categoryId: "places",
    titleKey: "badge.places_100",
    current: (ctx) => ctx.countriesVisitedIds.length,
    target: () => 100,
  },
  {
    id: "places_all",
    categoryId: "places",
    titleKey: "badge.places_all",
    current: (ctx) => ctx.countriesVisitedIds.length,
    target: () => worldData.countries.length,
  },

  // Kıtalar
  {
    id: "continent_3",
    categoryId: "places",
    titleKey: "badge.continent_3",
    current: (ctx) => getVisitedContinents(ctx.countriesVisitedIds).size,
    target: () => 3,
  },
  {
    id: "continent_5",
    categoryId: "places",
    titleKey: "badge.continent_5",
    current: (ctx) => getVisitedContinents(ctx.countriesVisitedIds).size,
    target: () => 5,
  },
  {
    id: "continent_all",
    categoryId: "places",
    titleKey: "badge.continent_all",
    current: (ctx) => getVisitedContinents(ctx.countriesVisitedIds).size,
    target: () => getTotalContinentCount(),
  },
];

export function computeBadges(ctx: BadgeContext): Badge[] {
  return BADGE_DEFINITIONS.map((def) => ({
    id: def.id,
    categoryId: def.categoryId,
    titleKey: def.titleKey,
    current: def.current(ctx),
    target: def.target(ctx),
    earned: def.current(ctx) >= def.target(ctx),
    // "tümü" badges depend on totals that load asynchronously (0 until then);
    // filtered out below rather than rendered as a false "0/0 earned" state.
  })).filter((badge) => badge.target > 0);
}
