import type { Language } from "@/contexts/language-context";
import type { HeritageItem } from "@/data/heritageSites";

// Heritage site names/descriptions are the official UNESCO English text by
// default — translating all ~1270 entries isn't worth the risk/effort in one
// go. Turkish translations are instead added incrementally as `nameTr` /
// `descriptionTr` fields directly on a site's record in
// data/heritageSites.json (re-run scripts/compress-heritage-data.mjs after
// editing it). This just applies whichever of those fields exist.

/** Applies a hand-curated Turkish override when one exists for this site;
 * otherwise returns the item unchanged (English). */
export function getLocalizedHeritageItem<T extends HeritageItem>(
  item: T,
  language: Language,
): T {
  if (language === "en") return item;
  if (!item.nameTr && !item.descriptionTr) return item;
  return {
    ...item,
    name: item.nameTr ?? item.name,
    description: item.descriptionTr ?? item.description,
  };
}
