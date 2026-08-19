import { CUISINE_VISITED_KEY } from "@/data/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** The locally-tasted meal id list, refreshed every time the screen regains
 * focus (so a toggle made on another screen — or after a cloud sync — shows
 * up without a manual reload). */
export function useCuisineVisited() {
  const [visited, setVisited] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(CUISINE_VISITED_KEY).then((raw) => {
        setVisited(raw ? JSON.parse(raw) : []);
      });
    }, []),
  );

  return [visited, setVisited] as const;
}
