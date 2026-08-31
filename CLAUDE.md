# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Wanderlist" (internal repo name `life-list`, bundle id `com.wanderlist.app`) — an Expo/React Native app where users check off World Heritage sites, countries visited, cuisines tasted, and (paid) islands visited. Capitals exists as a placeholder (`implemented: false`) with no data yet. Turkish is the default UI language; English is the fallback.

## Keeping this file current

Whenever you implement something new — a new data source, table, screen, sync mechanism, or a pattern meant to be reused — add a short section (or extend an existing one) here describing it, in the same terms as the rest of this file: what it's for, where it lives, and how it relates to existing pieces it could be confused with. Do this as part of the change, not as a follow-up.

## Commands

```bash
npx expo start          # dev server (scan QR / press i / a / w)
npm run ios             # expo run:ios (native build)
npm run android         # expo run:android
npm run web             # expo start --web
npm run lint            # expo lint (flat eslint config, eslint-config-expo)
npx tsc --noEmit        # typecheck — there is no separate `typecheck` script
```

There is no test suite/framework in this repo — don't assume `npm test` exists.

Data/build utility scripts (run with `node`, not part of the app runtime):
- `npm run compress-heritage` — rebuilds `assets/heritage/heritage-data.json.gz` from `data/heritageSites.json` (see `scripts/compress-heritage-data.mjs`).
- `npm run heritage-status` — reports Turkish translation coverage for heritage sites.
- `scripts/generate-heritage-data.mjs`, `scripts/resolve-heritage-images.mjs` — one-off dataset generation/enrichment, not run routinely.
- `scripts/reset-project.js` (`npm run reset-project`) — the stock create-expo-app "move to app-example" script; not relevant to this project's actual code and shouldn't normally be run.

`postinstall` runs `patch-package` — `patches/expo-modules-jsi+*.patch` must stay applied; don't `npm install` in a way that skips it.

### Database migrations

Supabase has no CLI/migration setup wired into this repo. Schema changes live as plain SQL files in `scripts/*_schema.sql` (`user_backups_schema.sql`, `cuisine_meals_schema.sql`, `profiles_schema.sql`, `catalog_highlights_schema.sql`, `countries_schema.sql`) — idempotent, hand-run in the Supabase SQL Editor. When adding/changing a table, add or update one of these files; it is not applied automatically by anything in the repo or CI.

`scripts/add_highlight_examples.sql` has copy-paste templates for the founder's actual recurring task — adding a new "Son eklenenler"/"Yeni eklenenler" entry (a country or a dish) from the Supabase SQL Editor. Extend that file (don't answer the same question from scratch) if a new highlight type/workflow comes up.

`scripts/countries_schema.sql` is a read-only `countries` reference table (id/name/name_tr/iso2) generated from `data/worldCountries.json` — the app never reads it. It exists purely so that hand-written SQL inserts into `cuisine_meals`/`catalog_highlights` can look up a `country_id` by name (`select id from countries where name = 'Turkey'`) instead of a founder hardcoding/copying the numeric id, which fails silently (matches nothing, no FK to catch it) on a typo. If `worldCountries.json` changes, regenerate this file's `insert` block from it rather than hand-editing rows.

## Architecture

### Routing

`expo-router`, file-based, in `app/`. `app/(tabs)/` is a **`Stack` navigator, not React Navigation tabs** — the visible bottom tab bar is a hand-rolled component (`components/bottom-tab-bar.tsx`) that every tab screen renders manually at the bottom of its own JSX. There's no shared tab-bar layout wrapper; the icon list and the "+" action button live only in that one component.

Startup gate (`app/_layout.tsx`): the native splash screen stays up until `loadHeritageSites()` (decompresses the bundled heritage dataset) and `hydrateVisitedHeritage()` (loads the visited-heritage id list into the zustand store) both resolve. Every screen that reads `heritageSites` or the heritage slice of `useAppStore` assumes this already ran.

### The four (of five) implemented categories

`constants/categories.ts` defines `CategoryId = "heritage" | "places" | "cuisine" | "islands" | "capitals"` with per-category `bg`/`fg` colors, icon, and an `implemented` flag. Capitals is `implemented: false` — UI that lists categories should treat that flag as "show as coming soon, no data source, no visited-toggle wiring yet," not delete the entry.

Each implemented category has its own data source and its own "visited" storage, but they all follow the **same toggle contract**: `toggle<X>Visited(id, itemInfo | undefined, currentVisitedIds) => Promise<updatedVisitedIds>`, which persists to `AsyncStorage`, calls `queueCloudSync()` (debounced push to Supabase), and — only on a fresh mark (not on unmark) — calls `maybePromptSignup()` (one-time nudge for signed-out users, see `data/authPrompt.ts`) and `logActivity()` (personal marking history, `data/activityLog.ts`, surfaced on both the home screen and the Stats tab). `itemInfo` can be `undefined` when the caller doesn't need a fresh-mark activity-log entry (e.g. unmarking); pass the real name/subtitle/image when you do want it logged.

- **Heritage** (`data/heritageStorage.ts` → `toggleHeritageVisited`): dataset is a ~1273-site JSON list shipped gzip'd as `assets/heritage/heritage-data.json.gz` (see `data/heritageSites.ts` for why — Metro would otherwise compile a multi-MB JSON import to bytecode). Loaded once at boot into the module-level `heritageSites` array (mutated in place — never reassigned, so already-taken `import { heritageSites }` references stay valid) and a `Map` for `getHeritageSiteById`. Site photos resolve lazily per-item (Wikipedia thumbnail, cached — see `components/heritage-thumbnail.tsx`, `data/heritageImageCache.ts`, `data/wikipediaApi.ts`); a site's `imageUrl` is `undefined` until resolved, `null` if resolution found nothing. Visited-id list additionally lives in the zustand store `store/useAppStore.ts` (not just `AsyncStorage`) because it needs to be read/written from multiple unrelated screens without prop drilling.
- **Places/countries** (`data/placesStorage.ts` → `togglePlaceVisited`): static full country list in `data/worldCountries.json`; visited ids in `AsyncStorage` only (no store).
- **Cuisine** (`data/cuisineVisited.ts` → `toggleCuisineVisited`): the *content itself* (dishes) is **not bundled** — it's a live, publicly-readable Supabase table (`cuisine_meals`, see `scripts/cuisine_meals_schema.sql`). The app only ever reads it; you add/edit dishes from the Supabase dashboard. Fetches go through `data/cuisineMeals.ts` with an `AsyncStorage` cache and stale-while-revalidate hooks (`hooks/use-country-meals.ts` shows the pattern: return cached data instantly, then overwrite with a fresh fetch). Visited-meal ids are `AsyncStorage` only.
- **Islands** (`data/islandsVisited.ts` → `toggleIslandVisited`): same Supabase-backed shape as cuisine — content lives in `islands` (`scripts/islands_schema.sql`), reads go through `data/islands.ts` + `hooks/use-country-islands.ts`/`hooks/use-islands-index.ts` (stale-while-revalidate cache, mirrors `cuisineMeals.ts`/`use-country-meals.ts`/`use-cuisine-meal-index.ts` 1:1). What's different: Islands is **membership-gated**. `data/subscription.ts`'s `isIslandsUnlocked()` is the single source of truth for whether the current device may use the category — every entry point (`components/category-tile.tsx`, `app/modal.tsx`, `app/(tabs)/index.tsx`'s category grid) checks it and routes to `app/paywall.tsx` instead of `/islands` when locked, rather than duplicating the check. `toggleIslandVisited`/cloud sync are unaffected by lock state — they follow the same contract as every other category once a screen is reached.

### Subscriptions / RevenueCat (Islands paywall)

`data/subscription.ts` wraps `react-native-purchases` (+ `react-native-purchases-ui` for the paywall sheet). `configurePurchases()` is called once at startup from `app/_layout.tsx` using `EXPO_PUBLIC_REVENUECAT_API_KEY` (`.env`, not committed). `isIslandsUnlocked()` checks whether the `islands_premium` entitlement (constant `ISLANDS_ENTITLEMENT_ID`) is active on the current RevenueCat customer — this is the only source of truth callers should use, never a local flag. `presentIslandsPaywall()` (used by `app/paywall.tsx`) shows RevenueCat's dashboard-configured paywall UI for that entitlement and re-checks entitlement afterward. `loginPurchases`/`logoutPurchases` tie the RevenueCat customer id to the signed-in Supabase user id — called from `syncAfterAuth()` (`data/cloudSync.ts`) and from the sign-out handler in `app/(tabs)/profile.tsx`, respectively, so a purchase is attributed to the right account rather than an anonymous device.

The `EXPO_PUBLIC_REVENUECAT_API_KEY` currently in `.env` is a RevenueCat **Test Store** key (`test_` prefix) generated during onboarding — it exercises the full SDK/paywall flow but isn't wired to real money. Going live requires: creating the yearly subscription product in App Store Connect and Play Console, linking real iOS/Android apps to the RevenueCat project (which produces `appl_`/`goog_` keys), attaching those products to the `islands_premium` entitlement in the RevenueCat dashboard, and swapping the `.env` key for the real one — no code changes needed beyond that.

The RevenueCat **Offering** being built for this (`island_offering`, with monthly/yearly packages) is scoped to the Islands paywall only — it's shown from `app/paywall.tsx`, reached only via the islands-locked entry points above. If other categories get gated behind membership later, they'll need their own separate Offering/paywall screen designed individually, not a reuse of `island_offering` — don't wire a second category into this same paywall without a new offering being prepared for it first.

### Home screen's two "recent" sections — easy to conflate, keep them separate and visually distinct

`app/(tabs)/index.tsx` renders two conceptually different lists; don't merge them or give them the same visual treatment:

1. **"Son eklenenler" / `recent`** — the *viewer's own* recent marks (e.g. "I marked Athens visited"), sourced from `data/activityLog.ts` (`getActivityLog()`), same list shown on the Stats tab. Rendered as the original small-row design (44×44 thumbnail + title + category/time-ago text) — **not** `RecentItemCard`.
2. **"Yeni eklenenler" / `highlights`** — a "what's new" feed of content **we** (the app owner) added to any list, via `hooks/use-catalog-highlights.ts` → `data/catalogHighlights.ts`, backed by a separate publicly-readable Supabase table (`catalog_highlights`, see `scripts/catalog_highlights_schema.sql`) populated by hand via the Supabase dashboard whenever new content ships. Membership in this feed doesn't depend on the viewer's visited state — marking an item here visited/tasted must never remove it from the feed. Rendered with the big-photo-card component, `components/recent-item-card.tsx` — that component is reserved for this admin-curated rail, not the viewer's own activity.

Both toggle visited/tasted state through the same `toggle<X>Visited` functions (via the shared `isTypeIdVisited`/`toggleTypeId` helpers in `index.tsx`) — don't fork that logic per rail.

### Cloud sync

`lib/supabase.ts` sets up the client (anon key only — no service-role key anywhere in this repo/`\.env`, so nothing here can run schema DDL). `data/cloudSync.ts`'s `queueCloudSync()` debounces (1.5s) writes of the five `AsyncStorage`-backed lists (heritage/places/cuisine/islands visited + activity log) into one `user_backups` row per user (`scripts/user_backups_schema.sql`), RLS-scoped to `auth.uid()`. `syncAfterAuth()` (called after sign-in/sign-up) pulls existing cloud data if present, else seeds the cloud from whatever's on-device — also reconciles the optional profile fields (age group, gender, home country) that were stashed in Supabase Auth's `user_metadata` at sign-up time into the queryable `profiles` table, since `user_metadata` itself can't be joined/aggregated.

Auth (`app/auth.tsx`): email/password or Sign in with Apple, both via Supabase. Email sign-up requires confirmation (no session until the link is clicked) — code paths after `signUp()` must handle "user created but no session yet."

### i18n

`contexts/language-context.tsx` (`useLanguage()` → `{ language, setLanguage, t }`) resolves dot-path keys (`t("auth.signIn")`) against `constants/translations.ts`'s `{ tr: {...}, en: {...} }` object, falling back tr → en → the raw key if missing. `{{param}}` in a string is interpolated from the second arg. Persisted language choice lives in `AsyncStorage` (`APP_LANGUAGE_KEY`); default is `"tr"`. When adding user-facing strings, add both `tr` and `en` entries at the same dot-path in `constants/translations.ts` — there's no extraction tooling, it's a hand-maintained plain object.

Some datasets carry their own bilingual fields directly on the record instead of going through `translations.ts` (e.g. heritage sites' `nameTr`/`descriptionTr`, cuisine meals' `name_tr`/`description_tr`/`city_tr`, catalog highlights' `title_tr`/`subtitle_tr`) — look for a `localized*` helper (e.g. `localizedMealName`, `localizedHighlightTitle`) next to the type before writing a new one.
