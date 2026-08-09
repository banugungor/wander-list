import type { CategoryId } from "@/constants/categories";
import { getVisitedContinents, getTotalContinentCount } from "@/data/continents";
import worldData from "@/data/worldCountries.json";

export type Badge = {
  id: string;
  categoryId: CategoryId;
  title: string;
  earned: boolean;
  current: number;
  target: number;
};

export type BadgeContext = {
  heritageVisitedCount: number;
  heritageTotal: number;
  countriesVisitedIds: string[];
  cuisineVisitedMealIds: string[];
  cuisineMealAreas: Record<string, string>;
  cuisineTotalAreas: number;
};

type BadgeDefinition = {
  id: string;
  categoryId: CategoryId;
  title: string;
  current: (ctx: BadgeContext) => number;
  target: (ctx: BadgeContext) => number;
};

export function countTriedCuisineAreas(ctx: BadgeContext): number {
  const areas = new Set<string>();
  for (const mealId of ctx.cuisineVisitedMealIds) {
    const area = ctx.cuisineMealAreas[mealId];
    if (area) areas.add(area);
  }
  return areas.size;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Dünya Mirası
  {
    id: "heritage_5",
    categoryId: "heritage",
    title: "5 Dünya Mirası",
    current: (ctx) => ctx.heritageVisitedCount,
    target: () => 5,
  },
  {
    id: "heritage_25",
    categoryId: "heritage",
    title: "25 Dünya Mirası",
    current: (ctx) => ctx.heritageVisitedCount,
    target: () => 25,
  },
  {
    id: "heritage_100",
    categoryId: "heritage",
    title: "100 Dünya Mirası",
    current: (ctx) => ctx.heritageVisitedCount,
    target: () => 100,
  },
  {
    id: "heritage_all",
    categoryId: "heritage",
    title: "Tüm Dünya Mirasları",
    current: (ctx) => ctx.heritageVisitedCount,
    target: (ctx) => ctx.heritageTotal,
  },

  // Ülkeler
  {
    id: "places_10",
    categoryId: "places",
    title: "10 Ülke",
    current: (ctx) => ctx.countriesVisitedIds.length,
    target: () => 10,
  },
  {
    id: "places_50",
    categoryId: "places",
    title: "50 Ülke",
    current: (ctx) => ctx.countriesVisitedIds.length,
    target: () => 50,
  },
  {
    id: "places_100",
    categoryId: "places",
    title: "100 Ülke",
    current: (ctx) => ctx.countriesVisitedIds.length,
    target: () => 100,
  },
  {
    id: "places_all",
    categoryId: "places",
    title: "Tüm Ülkeler",
    current: (ctx) => ctx.countriesVisitedIds.length,
    target: () => worldData.countries.length,
  },

  // Kıtalar
  {
    id: "continent_3",
    categoryId: "places",
    title: "3 Kıta",
    current: (ctx) => getVisitedContinents(ctx.countriesVisitedIds).size,
    target: () => 3,
  },
  {
    id: "continent_5",
    categoryId: "places",
    title: "5 Kıta",
    current: (ctx) => getVisitedContinents(ctx.countriesVisitedIds).size,
    target: () => 5,
  },
  {
    id: "continent_all",
    categoryId: "places",
    title: "Tüm Kıtalar",
    current: (ctx) => getVisitedContinents(ctx.countriesVisitedIds).size,
    target: () => getTotalContinentCount(),
  },

  // Mutfaklar
  {
    id: "cuisine_5",
    categoryId: "cuisine",
    title: "5 Mutfak Bölgesi",
    current: countTriedCuisineAreas,
    target: () => 5,
  },
  {
    id: "cuisine_15",
    categoryId: "cuisine",
    title: "15 Mutfak Bölgesi",
    current: countTriedCuisineAreas,
    target: () => 15,
  },
  {
    id: "cuisine_all",
    categoryId: "cuisine",
    title: "Tüm Mutfak Bölgeleri",
    current: countTriedCuisineAreas,
    target: (ctx) => ctx.cuisineTotalAreas,
  },
];

export function computeBadges(ctx: BadgeContext): Badge[] {
  return BADGE_DEFINITIONS.map((def) => ({
    id: def.id,
    categoryId: def.categoryId,
    title: def.title,
    current: def.current(ctx),
    target: def.target(ctx),
    earned: def.current(ctx) >= def.target(ctx),
    // "tümü" badges depend on totals that load asynchronously (0 until then);
    // filtered out below rather than rendered as a false "0/0 earned" state.
  })).filter((badge) => badge.target > 0);
}
