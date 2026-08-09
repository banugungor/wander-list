import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";

export type CategoryId = "heritage" | "places" | "cuisine" | "books" | "movies";

export type Category = {
  id: CategoryId;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  implemented: boolean;
};

export const categories: Category[] = [
  {
    id: "heritage",
    title: "Dünya Mirası",
    icon: "business-outline",
    bg: palette.greenSoft,
    fg: palette.greenText,
    implemented: true,
  },
  {
    id: "places",
    title: "Gittiğin Ülkeler",
    icon: "location-outline",
    bg: palette.greenSoft,
    fg: palette.greenText,
    implemented: true,
  },
  {
    id: "cuisine",
    title: "Mutfaklar",
    icon: "restaurant-outline",
    bg: palette.coralPale,
    fg: palette.coralText,
    implemented: true,
  },
  {
    id: "books",
    title: "Kitaplar",
    icon: "book-outline",
    bg: palette.violetPale,
    fg: palette.violetText,
    implemented: false,
  },
  {
    id: "movies",
    title: "Filmler",
    icon: "film-outline",
    bg: palette.bluePale,
    fg: palette.blueText,
    implemented: false,
  },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
