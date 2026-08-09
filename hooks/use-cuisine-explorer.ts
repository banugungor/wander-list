import { queueCloudSync } from "@/data/cloudSync";
import { fetchCuisines, type CuisineItem } from "@/data/cuisineApi";
import { CUISINE_AREA_TOTALS_KEY } from "@/data/heritageStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

/** Drives the "World Cuisines" tab of the explore screen: fetches the list of
 * cuisine areas and, in the background, how many meals each one has. */
export function useCuisineExplorer(enabled: boolean) {
  const [data, setData] = useState<CuisineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCuisineList = useCallback(async () => {
    try {
      setLoading(true);

      const cuisines = await fetchCuisines();

      const seenAreas = new Set<string>();
      const deduped = cuisines.filter((c) => {
        if (!c.id || seenAreas.has(c.id)) return false;
        seenAreas.add(c.id);
        return true;
      });

      setData(deduped);
      setLoading(false);

      // Tüm alanların yemek sayılarını arka planda çek (bir kez)
      const existingRaw = await AsyncStorage.getItem(CUISINE_AREA_TOTALS_KEY);
      let existingTotals: Record<string, number> = {};
      if (existingRaw) {
        try {
          existingTotals = JSON.parse(existingRaw);
        } catch (e) {
          console.log("CUISINE TOTALS PARSE ERROR", e);
        }
      }
      const missing = deduped.filter(
        (c) => existingTotals[c.name] === undefined,
      );

      if (missing.length > 0) {
        const fetched: Record<string, number> = {};
        await Promise.all(
          missing.map(async (c) => {
            try {
              const r = await fetch(
                `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(c.id)}`,
              );
              const j = await r.json();
              fetched[c.name] = (j.meals ?? []).length;
            } catch {}
          }),
        );
        const merged = { ...existingTotals, ...fetched };
        await AsyncStorage.setItem(
          CUISINE_AREA_TOTALS_KEY,
          JSON.stringify(merged),
        );
        queueCloudSync();
      }
    } catch (e) {
      console.log("CUISINE ERROR", e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchCuisineList();
  }, [enabled, fetchCuisineList]);

  return { data, loading };
}
