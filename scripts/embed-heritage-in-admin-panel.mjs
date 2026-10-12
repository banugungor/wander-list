// Refreshes the heritage site list embedded in scripts/admin-panel.html from
// data/heritageSites.json. The admin panel's "Miras" tab needs the site
// list to pick a site to attach a photo to, but the list isn't in Supabase
// (it ships bundled with the app) and the panel is a standalone static page
// with no access to the repo — so a compact [id, name, nameTr, country] copy
// is inlined into a <script type="application/json"> block.
//
// Re-run (`npm run admin-heritage-list`) whenever data/heritageSites.json
// gains/loses sites or gets new Turkish names, then redeploy the panel.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sitesPath = join(root, "data", "heritageSites.json");
const panelPath = join(root, "scripts", "admin-panel.html");

const sites = JSON.parse(readFileSync(sitesPath, "utf8"));
const rows = sites.map((s) => [s.id, s.name, s.nameTr ?? "", s.country ?? ""]);

// "<" is escaped so a name can never close the <script> element early.
const json = JSON.stringify(rows).replace(/</g, "\\u003c");

const html = readFileSync(panelPath, "utf8");
const pattern =
  /(<script id="heritageSitesData" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!pattern.test(html)) {
  throw new Error('No <script id="heritageSitesData"> block found in admin-panel.html');
}

writeFileSync(panelPath, html.replace(pattern, (_, open, close) => `${open}${json}${close}`));
console.log(`Embedded ${rows.length} heritage sites (${json.length} bytes) into admin-panel.html`);
