const summaryCache = new Map<string, Promise<string | null>>();

const fetchSummaryThumbnail = async (title: string): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    );
    if (!res.ok) return null;

    const json = await res.json();
    return json?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
};

const searchForTitle = async (query: string): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch=${encodeURIComponent(query)}`,
    );
    if (!res.ok) return null;

    const json = await res.json();
    return json?.query?.search?.[0]?.title ?? null;
  } catch {
    return null;
  }
};

export const fetchWikipediaThumbnail = (
  name: string,
): Promise<string | null> => {
  const cached = summaryCache.get(name);
  if (cached) return cached;

  const promise = (async () => {
    const direct = await fetchSummaryThumbnail(name);
    if (direct) return direct;

    const foundTitle = await searchForTitle(name);
    if (!foundTitle) return null;

    return fetchSummaryThumbnail(foundTitle);
  })();

  summaryCache.set(name, promise);
  return promise;
};
