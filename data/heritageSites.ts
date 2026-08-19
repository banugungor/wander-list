import { Asset } from "expo-asset";
// expo-file-system's root export moved to a new File/Directory API in SDK
// 57; readAsStringAsync now only exists (and works) under /legacy.
import * as FileSystem from "expo-file-system/legacy";
import { toByteArray } from "base64-js";
import { ungzip } from "pako";
import { Platform } from "react-native";

export type HeritageItem = {
  id: string;
  name: string;
  // Hand-curated Turkish overrides, filled in directly on the record in
  // data/heritageSites.json — see getLocalizedHeritageItem in
  // heritageTranslations.ts, which reads these.
  nameTr?: string;
  country: string;
  category?: "Cultural" | "Natural" | "Mixed";
  description?: string;
  descriptionTr?: string;
  // undefined = not resolved yet (resolved lazily on-device, see
  // heritage-thumbnail.tsx), null = resolved but no image found
  imageUrl?: string | null;
  latitude?: number;
  longitude?: number;
};

/** The full UNESCO World Heritage list. Starts empty and is filled in place
 * by loadHeritageSites() — every existing `import { heritageSites }` call
 * site keeps working unchanged, since they all read it after that load
 * resolves (see the await in app/_layout.tsx) rather than at module-eval
 * time. Mutate-in-place, never reassign, or those imports go stale. */
export const heritageSites: HeritageItem[] = [];

let heritageSitesById = new Map<string, HeritageItem>();
let loadPromise: Promise<void> | null = null;

/** Native: the asset is copied into a local `file://` path by
 * downloadAsync(), so it's read as base64 via expo-file-system and decoded
 * with base64-js. Web: there is no filesystem — downloadAsync() just
 * resolves the asset's http(s) URL, which we fetch() directly as bytes. */
async function readAssetBytes(asset: Asset): Promise<Uint8Array> {
  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);
    return new Uint8Array(await response.arrayBuffer());
  }

  if (!asset.localUri) {
    throw new Error("Heritage dataset asset has no local URI");
  }
  const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return toByteArray(base64);
}

/**
 * Downloads and decompresses the gzip'd heritage dataset asset
 * (assets/heritage/heritage-data.json.gz, built by
 * scripts/compress-heritage-data.mjs from data/heritageSites.json) and fills
 * in `heritageSites`.
 *
 * The dataset is shipped as a compressed asset — decompressed with
 * JSON.parse at runtime — rather than `import`-ed as JSON directly, because
 * Metro turns a `require()`d/`import`ed JSON file into a JS object literal
 * that Hermes compiles to bytecode. For a ~1.3MB file (and growing as
 * Turkish translations are added) that bloats both app size and startup
 * parse time far more than plain JSON.parse of gzipped text does.
 *
 * Must be awaited once, before the app renders (see app/_layout.tsx) — every
 * other module in the app assumes `heritageSites` is already populated.
 * Safe to call more than once; later calls reuse the first load.
 */
export function loadHeritageSites(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const asset = Asset.fromModule(
        require("@/assets/heritage/heritage-data.json.gz"),
      );
      await asset.downloadAsync();

      const bytes = await readAssetBytes(asset);
      const json = ungzip(bytes, { toText: true });
      const items = JSON.parse(json) as HeritageItem[];

      heritageSites.push(...items);
      heritageSitesById = new Map(items.map((s) => [s.id, s]));
    })();
  }
  return loadPromise;
}

export function getHeritageSiteById(id: string): HeritageItem | null {
  return heritageSitesById.get(id) ?? null;
}
