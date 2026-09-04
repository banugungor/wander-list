// Dev tool — NOT part of the app runtime.
// Supabase's dashboard makes it hard to eyeball "what did I already add,
// and where" across cuisine_meals/islands/catalog_highlights. This pulls
// those three public-read tables and writes a human-readable, country-
// grouped snapshot to a LOCAL, GITIGNORED file (catalog-snapshot.md) — never
// committed, never imported by the app, so it never reaches git or a store
// build. Re-run it whenever you want the snapshot to catch up with Supabase;
// there's no automatic sync.
//
// Usage:
//   npm run catalog-snapshot
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Run with: node --env-file=.env scripts/catalog-snapshot.mjs\n" +
      "(or just: npm run catalog-snapshot)",
  );
  process.exit(1);
}

const OUTPUT_PATH = fileURLToPath(
  new URL("../catalog-snapshot.md", import.meta.url),
);
const COUNTRIES_PATH = fileURLToPath(
  new URL("../data/worldCountries.json", import.meta.url),
);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PostgREST caps a single response at 1000 rows by default — both
// cuisine_meals and islands already exceed that, so a plain .select("*")
// silently truncates. Page through in chunks instead.
const PAGE_SIZE = 1000;
async function fetchAll(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return { data: rows, error: null };
}

function groupByCountry(rows, countryNameById) {
  const byCountry = new Map();
  for (const row of rows) {
    const label = countryNameById.get(row.country_id) ?? `Bilinmeyen (${row.country_id})`;
    if (!byCountry.has(label)) byCountry.set(label, []);
    byCountry.get(label).push(row);
  }
  return [...byCountry.entries()].sort(([a], [b]) => a.localeCompare(b, "tr"));
}

function renderMeals(rows, countryNameById) {
  const grouped = groupByCountry(rows, countryNameById);
  const lines = [`## Cuisine — cuisine_meals (${rows.length})`, ""];
  for (const [country, items] of grouped) {
    lines.push(`### ${country} (${items.length})`);
    for (const item of items.sort((a, b) => a.name.localeCompare(b.name, "tr"))) {
      const city = item.city ? ` — ${item.city}` : "";
      lines.push(`- ${item.name}${item.name_tr ? ` / ${item.name_tr}` : ""}${city} (id: ${item.id})`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function renderIslands(rows, countryNameById) {
  const grouped = groupByCountry(rows, countryNameById);
  const lines = [`## Islands — islands (${rows.length})`, ""];
  for (const [country, items] of grouped) {
    lines.push(`### ${country} (${items.length})`);
    for (const item of items.sort((a, b) => a.name.localeCompare(b.name, "tr"))) {
      lines.push(`- ${item.name}${item.name_tr ? ` / ${item.name_tr}` : ""} (id: ${item.id})`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function renderHighlights(rows) {
  const lines = [`## Catalog highlights — catalog_highlights (${rows.length})`, ""];
  const sorted = [...rows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
  for (const item of sorted) {
    lines.push(
      `- [${item.type}] ${item.title}${item.title_tr ? ` / ${item.title_tr}` : ""} (item_id: ${item.item_id}, eklenme: ${item.created_at?.slice(0, 10)})`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const countries = JSON.parse(await readFile(COUNTRIES_PATH, "utf8")).countries;
  const countryNameById = new Map(countries.map((c) => [c.id, c.name]));

  const [meals, islands, highlights] = await Promise.all([
    fetchAll("cuisine_meals"),
    fetchAll("islands"),
    fetchAll("catalog_highlights"),
  ]);

  for (const [label, result] of [
    ["cuisine_meals", meals],
    ["islands", islands],
    ["catalog_highlights", highlights],
  ]) {
    if (result.error) {
      console.error(`Failed to fetch ${label}:`, result.error.message);
      process.exit(1);
    }
  }

  const now = new Date().toISOString();
  const body = [
    "<!-- Otomatik oluşturuldu — elle düzenlemeyin. Güncellemek için: npm run catalog-snapshot -->",
    `# Katalog envanteri (Supabase snapshot)`,
    "",
    `Son güncelleme: ${now}`,
    "",
    renderMeals(meals.data, countryNameById),
    renderIslands(islands.data, countryNameById),
    renderHighlights(highlights.data),
  ].join("\n");

  await writeFile(OUTPUT_PATH, body, "utf8");
  console.log(
    `catalog-snapshot.md güncellendi — ${meals.data.length} yemek, ${islands.data.length} ada, ${highlights.data.length} highlight.`,
  );
}

main();
