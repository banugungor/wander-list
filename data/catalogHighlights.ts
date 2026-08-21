import type { CategoryId } from "@/constants/categories";
import { CATALOG_HIGHLIGHTS_KEY } from "@/data/storageKeys";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CatalogHighlight = {
  id: number;
  type: CategoryId;
  itemId: string;
  title: string;
  titleTr: string | null;
  subtitle: string | null;
  subtitleTr: string | null;
  imageUrl: string | null;
  iso2: string | null;
  createdAt: string;
};

type HighlightRow = {
  id: number;
  type: CategoryId;
  item_id: string;
  title: string;
  title_tr: string | null;
  subtitle: string | null;
  subtitle_tr: string | null;
  image_url: string | null;
  iso2: string | null;
  created_at: string;
};

function fromRow(row: HighlightRow): CatalogHighlight {
  return {
    id: row.id,
    type: row.type,
    itemId: row.item_id,
    title: row.title,
    titleTr: row.title_tr,
    subtitle: row.subtitle,
    subtitleTr: row.subtitle_tr,
    imageUrl: row.image_url,
    iso2: row.iso2,
    createdAt: row.created_at,
  };
}

export function localizedHighlightTitle(
  highlight: CatalogHighlight,
  language: "tr" | "en",
): string {
  return (language === "tr" && highlight.titleTr) || highlight.title;
}

export function localizedHighlightSubtitle(
  highlight: CatalogHighlight,
  language: "tr" | "en",
): string | null {
  return (language === "tr" && highlight.subtitleTr) || highlight.subtitle;
}

export async function getCachedCatalogHighlights(): Promise<CatalogHighlight[]> {
  const raw = await AsyncStorage.getItem(CATALOG_HIGHLIGHTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Live-fetches the newest additions across every list — the home screen's
 * "Son Eklenenler" feed — and refreshes the local cache. Throws on failure;
 * callers fall back to the cache. */
export async function fetchCatalogHighlights(limit = 10): Promise<CatalogHighlight[]> {
  const { data, error } = await supabase
    .from("catalog_highlights")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const highlights = (data as HighlightRow[]).map(fromRow);
  await AsyncStorage.setItem(CATALOG_HIGHLIGHTS_KEY, JSON.stringify(highlights));
  return highlights;
}
