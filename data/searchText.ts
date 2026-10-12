/** Folds text for search comparison so "isviçre", "İsviçre", "ISVICRE" and
 * "Isvicre" all compare equal. Plain `toLowerCase()` can't do this: in JS,
 * "İ".toLowerCase() is "i" + a combining dot (U+0307), so typing a dotless
 * "isviçre" never matched "İsviçre", and "I" never matched Turkish "ı". We
 * map the Turkish dotted/dotless I variants to "i" first, then lowercase and
 * strip any remaining diacritics (ç→c, ş→s, ğ→g, ö→o, ü→u, é→e, å→a …). */
export function normalizeSearchText(text: string): string {
  const folded = text.replace(/[İIı]/g, "i").toLowerCase();
  // `normalize` is missing on some very old JS engines; skip diacritic
  // stripping there rather than crash.
  if (typeof folded.normalize !== "function") return folded;
  return folded.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** True when `query` is empty or is contained in any of `candidates`, using
 * `normalizeSearchText` on both sides. Use this for every search box instead
 * of `toLowerCase().includes()`. */
export function matchesSearch(query: string, ...candidates: string[]): boolean {
  const q = normalizeSearchText(query.trim());
  if (!q) return true;
  return candidates.some((candidate) => normalizeSearchText(candidate).includes(q));
}
