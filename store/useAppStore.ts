import { create } from "zustand";

type AppState = {
  visitedHeritage: string[];
  setVisitedHeritage: (ids: string[]) => void;
};

export const useAppStore = create<AppState>((set) => ({
  visitedHeritage: [],
  setVisitedHeritage: (ids) => set({ visitedHeritage: ids }),
}));