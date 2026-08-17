// One-off data generation script — NOT part of the app runtime.
// Pre-resolves a Wikipedia thumbnail URL for every heritage site and bakes
// it into data/heritageSites.json, so the shipped app never has to call
// Wikipedia's API on-device (see components/heritage-thumbnail.tsx) — that
// per-device lookup was the source of rate-limiting/permanent-failure bugs
// once the app reached real users on real networks.
//
// Pass 1 batches up to 50 titles per request via MediaWiki's `action=query`
// (far cheaper than one request per site). Pass 2 falls back to an
// individual search+summary lookup, with a delay between requests, for
// titles that don't match a Wikipedia page directly.
//
// Re-run this whenever new heritage sites are added to heritageSites.json:
//   node scripts/resolve-heritage-images.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const DATA_PATH = fileURLToPath(
  new URL("../data/heritageSites.json", import.meta.url),
);
const USER_AGENT =
  "Wanderlist-app/1.0 (contact: banu@ecommerc.io) one-off-image-resolution-script";
const BATCH_SIZE = 50;
const DELAY_MS = 250;
const THUMB_SIZE = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function wikiActionApi(params) {
  const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({
    format: "json",
    ...params,
  })}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status} for ${url}`);
  return res.json();
}

// Resolves up to BATCH_SIZE titles in a single request. Returns a map of
// the ORIGINAL requested title -> thumbnail url (or null if no thumbnail).
async function batchResolve(titles) {
  const json = await wikiActionApi({
    action: "query",
    titles: titles.join("|"),
    prop: "pageimages",
    pithumbsize: String(THUMB_SIZE),
    redirects: "1",
  });

  const pages = Object.values(json?.query?.pages ?? {});
  const byResolvedTitle = new Map(
    pages.map((p) => [p.title, p.thumbnail?.source ?? null]),
  );

  let resolvedTitle = new Map(titles.map((t) => [t, t]));
  for (const n of json?.query?.normalized ?? []) {
    for (const [orig, cur] of resolvedTitle) {
      if (cur === n.from) resolvedTitle.set(orig, n.to);
    }
  }
  for (const r of json?.query?.redirects ?? []) {
    for (const [orig, cur] of resolvedTitle) {
      if (cur === r.from) resolvedTitle.set(orig, r.to);
    }
  }

  const result = new Map();
  for (const original of titles) {
    const finalTitle = resolvedTitle.get(original);
    result.set(original, byResolvedTitle.get(finalTitle) ?? null);
  }
  return result;
}

// Fallback for titles that don't match a Wikipedia page directly: search,
// then fetch the top result's summary thumbnail.
async function searchResolve(name) {
  const searchJson = await wikiActionApi({
    action: "query",
    list: "search",
    srlimit: "1",
    srsearch: name,
  });
  const title = searchJson?.query?.search?.[0]?.title;
  if (!title) return null;

  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { "User-Agent": USER_AGENT } },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json?.thumbnail?.source ?? null;
}

async function main() {
  const sites = JSON.parse(await readFile(DATA_PATH, "utf8"));
  const pending = sites.filter((s) => s.imageUrl === undefined);
  console.log(
    `${sites.length} total sites, ${pending.length} need image resolution.`,
  );

  const batches = chunk(pending, BATCH_SIZE);
  for (const [i, batch] of batches.entries()) {
    const resolved = await batchResolve(batch.map((s) => s.name));
    let hits = 0;
    for (const site of batch) {
      const url = resolved.get(site.name);
      if (url) {
        site.imageUrl = url;
        hits++;
      }
    }
    console.log(
      `Batch ${i + 1}/${batches.length}: ${hits}/${batch.length} resolved directly`,
    );
    await sleep(DELAY_MS);
  }

  const stillMissing = sites.filter((s) => s.imageUrl === undefined);
  console.log(`${stillMissing.length} sites need a search fallback...`);

  let fallbackHits = 0;
  for (const [i, site] of stillMissing.entries()) {
    site.imageUrl = await searchResolve(site.name);
    if (site.imageUrl) fallbackHits++;

    if (i > 0 && i % 25 === 0) {
      console.log(`  fallback ${i}/${stillMissing.length}...`);
    }
    await sleep(DELAY_MS);
  }

  const totalResolved = sites.filter((s) => s.imageUrl).length;
  const totalNoImage = sites.filter((s) => s.imageUrl === null).length;
  console.log(
    `Done. ${totalResolved} sites have an image, ${totalNoImage} have none (fallback found ${fallbackHits}/${stillMissing.length}).`,
  );

  await writeFile(DATA_PATH, `${JSON.stringify(sites, null, 2)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
