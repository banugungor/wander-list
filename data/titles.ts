import type { CategoryId } from "@/constants/categories";
import type { BadgeContext } from "@/data/badges";
import { getVisitedContinents } from "@/data/continents";

type Tier = { threshold: number; titleKey: string };

// Ordered lowest → highest; the highest tier whose threshold is reached wins.
// titleKey resolves via translations.ts, e.g. t(titleKey) -> "title.places.explorer".
const TIERS_BY_CATEGORY: Partial<Record<CategoryId, Tier[]>> = {
  places: [
    { threshold: 1, titleKey: "title.places.explorer" },
    { threshold: 10, titleKey: "title.places.traveler" },
    { threshold: 50, titleKey: "title.places.adventurer" },
    { threshold: 100, titleKey: "title.places.globetrotter" },
  ],
  heritage: [
    { threshold: 1, titleKey: "title.heritage.curious" },
    { threshold: 5, titleKey: "title.heritage.cultureHunter" },
    { threshold: 25, titleKey: "title.heritage.heritageExplorer" },
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
    case "heritage":
      return ctx.heritageVisitedCount;
    default:
      return 0;
  }
}

/** Returns a translations.ts key (e.g. "title.places.explorer") — resolve with t(). */
export function getTitleKey(categoryId: CategoryId, ctx: BadgeContext): string | null {
  const tiers = TIERS_BY_CATEGORY[categoryId];
  if (!tiers) return null;

  const current = currentCountFor(categoryId, ctx);
  let earned: string | null = null;
  for (const tier of tiers) {
    if (current >= tier.threshold) earned = tier.titleKey;
  }
  return earned;
}
