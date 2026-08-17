import type { Language } from "@/contexts/language-context";
import type { HeritageItem } from "@/data/heritageSites";

type HeritageTranslation = { name?: string; description?: string };

// Heritage site names/descriptions are the official UNESCO English text by
// default (see the product decision in heritageSites.json) — translating all
// ~1270 entries isn't worth the risk. This is a hand-curated exception list,
// keyed by heritageSites.json's `id`, for sites worth a Turkish translation.
export const HERITAGE_TRANSLATIONS_TR: Record<string, HeritageTranslation> = {
  "48ddf9d1-dafe-50c3-a793-c22d11ce77a7": {
    name: "Sardes ve Bin Tepe Lidya Tümülüsleri",
    description:
      "Sardes, zenginliği ve erken dönem madeni para üretimiyle tanınan güçlü bir Demir Çağı medeniyeti olan Lidyalıların başkentiydi (MÖ 8-6. yüzyıllar). Kent; surlarla çevrili, teraslı ve yerleşim, kutsal alan ile mezarlık gibi farklı bölgelere ayrılmış özgün bir kent dokusuna sahipti. Bin Tepe mezarlığı, dünyanın en büyük tümülüs mezarlarından bazılarını barındırır. Lidyalılar kendine özgü bir dil ve din sistemi geliştirmiş, Yunan, Roma ve Avrupa kaynaklarında sıkça anılmıştır. Yıkılışlarının ardından Sardes; Pers, Yunan, Roma ve Bizans dönemlerinde de önemini korumaya devam etmiştir.",
  },
};

/** Applies a hand-curated Turkish override when one exists for this site;
 * otherwise returns the item unchanged (English). */
export function getLocalizedHeritageItem<T extends HeritageItem>(
  item: T,
  language: Language,
): T {
  if (language === "en") return item;
  const translation = HERITAGE_TRANSLATIONS_TR[item.id];
  if (!translation) return item;
  return {
    ...item,
    name: translation.name ?? item.name,
    description: translation.description ?? item.description,
  };
}
