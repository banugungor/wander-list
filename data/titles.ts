import type { CategoryId } from "@/constants/categories";
import { countTriedCuisineAreas, type BadgeContext } from "@/data/badges";
import { getVisitedContinents } from "@/data/continents";

type Tier = { threshold: number; title: string };

// Ordered lowest → highest; the highest tier whose threshold is reached wins.
const TIERS_BY_CATEGORY: Partial<Record<CategoryId, Tier[]>> = {
  places: [
    { threshold: 1, title: "Kaşif" },
    { threshold: 10, title: "Gezgin" },
    { threshold: 50, title: "Maceraperest" },
    { threshold: 100, title: "Dünya Gezgini" },
  ],
  cuisine: [
    { threshold: 1, title: "Meraklı" },
    { threshold: 5, title: "Gurme" },
    { threshold: 15, title: "Şef" },
  ],
  heritage: [
    { threshold: 1, title: "Meraklı" },
    { threshold: 5, title: "Kültür Avcısı" },
    { threshold: 25, title: "Miras Kaşifi" },
  ],
};

function currentCountFor(categoryId: CategoryId, ctx: BadgeContext): number {
  switch (categoryId) {
    case "places":
      // Ülke sayısı ve ziyaret edilen kıta sayısından yüksek olanı esas al —
      // az sayıda ülkeyle bile birden fazla kıtaya gitmiş biri "Kaşif" sayılsın.
      return Math.max(
        ctx.countriesVisitedIds.length,
        getVisitedContinents(ctx.countriesVisitedIds).size,
      );
    case "cuisine":
      return countTriedCuisineAreas(ctx);
    case "heritage":
      return ctx.heritageVisitedCount;
    default:
      return 0;
  }
}

export function getTitle(categoryId: CategoryId, ctx: BadgeContext): string | null {
  const tiers = TIERS_BY_CATEGORY[categoryId];
  if (!tiers) return null;

  const current = currentCountFor(categoryId, ctx);
  let earned: string | null = null;
  for (const tier of tiers) {
    if (current >= tier.threshold) earned = tier.title;
  }
  return earned;
}
