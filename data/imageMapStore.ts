import { createRemoteMapStore } from "@/data/remoteMapStore";

type Config = {
  /** Supabase table holding one `image_url` per key. */
  table: string;
  /** Name of the table's key column (e.g. `site_id`, `country_id`). */
  keyColumn: string;
  cacheKey: string;
  /** Used in console messages only. */
  label: string;
};

/** `key → photo URL` store for the admin-panel photo overrides (heritage
 * sites, countries); the loading/caching behaviour lives in
 * remoteMapStore.ts. */
export function createImageMapStore({ table, keyColumn, cacheKey, label }: Config) {
  const store = createRemoteMapStore<string>({
    table,
    keyColumn,
    valueColumns: "image_url",
    toValue: (row) => (typeof row.image_url === "string" ? row.image_url : null),
    cacheKey,
    label,
  });

  return {
    subscribe: store.subscribe,
    getMap: store.getMap,
    getUrl: store.getValue,
    load: store.load,
  };
}
