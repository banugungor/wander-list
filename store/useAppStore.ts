import { HERITAGE_VISITED_KEY } from "@/data/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

type AppState = {
  visitedHeritage: string[];
  setVisitedHeritage: (ids: string[]) => void;
};

export const useAppStore = create<AppState>((set) => ({
  visitedHeritage: [],
  setVisitedHeritage: (ids) => set({ visitedHeritage: ids }),
}));

/** Loads visitedHeritage from disk into the store — must run once at app
 * startup (see app/_layout.tsx), otherwise every screen that reads it starts
 * from an empty list regardless of what's actually saved, and the next
 * toggle overwrites the real saved list with that stale empty one. */
export async function hydrateVisitedHeritage(): Promise<void> {
  const raw = await AsyncStorage.getItem(HERITAGE_VISITED_KEY);
  useAppStore.getState().setVisitedHeritage(raw ? JSON.parse(raw) : []);
}