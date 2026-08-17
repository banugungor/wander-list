import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";

export type CategoryId = "heritage" | "places" | "cuisine" | "books" | "movies";

export type Category = {
  id: CategoryId;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  bgTo: string;
  fg: string;
  implemented: boolean;
};

export const categories: Category[] = [
  {
    id: "heritage",
    title: "Dünya Mirası",
    icon: "business-outline",
    bg: palette.greenSoft,
    bgTo: palette.greenSoftDeep,
    fg: palette.greenText,
    implemented: true,
  },
  {
    id: "places",
    title: "Gittiğin Ülkeler",
    icon: "location-outline",
    bg: palette.greenSoft,
    bgTo: palette.greenSoftDeep,
    fg: palette.greenText,
    implemented: true,
  },
  {
    id: "cuisine",
    title: "Mutfaklar",
    icon: "restaurant-outline",
    bg: palette.coralPale,
    bgTo: palette.coralPaleDeep,
    fg: palette.coralText,
    implemented: true,
  },
  {
    id: "books",
    title: "Kitaplar",
    icon: "book-outline",
    bg: palette.violetPale,
    bgTo: palette.violetPaleDeep,
    fg: palette.violetText,
    implemented: false,
  },
  {
    id: "movies",
    title: "Filmler",
    icon: "film-outline",
    bg: palette.bluePale,
    bgTo: palette.bluePaleDeep,
    fg: palette.blueText,
    implemented: false,
  },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
