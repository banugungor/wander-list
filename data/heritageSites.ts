import heritageSitesData from "@/data/heritageSites.json";

export type HeritageItem = {
  id: string;
  name: string;
  country: string;
  category?: "Cultural" | "Natural" | "Mixed";
  description?: string;
  // undefined = not resolved yet (resolved lazily on-device, see
  // heritage-thumbnail.tsx), null = resolved but no image found
  imageUrl?: string | null;
  latitude?: number;
  longitude?: number;
};

/** The full UNESCO World Heritage list, bundled at build time — see
 * scripts/generate-heritage-data.mjs. Re-run that script to refresh it. */
export const heritageSites = heritageSitesData as HeritageItem[];

const heritageSitesById = new Map(heritageSites.map((s) => [s.id, s]));

export function getHeritageSiteById(id: string): HeritageItem | null {
  return heritageSitesById.get(id) ?? null;
}
