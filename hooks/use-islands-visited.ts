import { ISLANDS_VISITED_KEY } from "@/data/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** The locally-visited island id list, refreshed every time the screen
 * regains focus (so a toggle made on another screen — or after a cloud
 * sync — shows up without a manual reload). */
export function useIslandsVisited() {
  const [visited, setVisited] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(ISLANDS_VISITED_KEY).then((raw) => {
        try {
          setVisited(raw ? JSON.parse(raw) : []);
        } catch (e) {
          console.log("ISLANDS VISITED PARSE ERROR", e);
          setVisited([]);
        }
      });
    }, []),
  );

  return [visited, setVisited] as const;
}
