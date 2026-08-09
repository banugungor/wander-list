import HeritageIllustration from "@/assets/illustrations/heritage.svg";
import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import type { SvgProps } from "react-native-svg";

export type CategoryId = "heritage" | "places" | "cuisine" | "books" | "movies";

export type Category = {
  id: CategoryId;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  implemented: boolean;
  image: string;
  illustration?: FC<SvgProps>;
};

export const categories: Category[] = [
  {
    id: "heritage",
    title: "Dünya Mirası",
    icon: "business-outline",
    bg: palette.greenSoft,
    fg: palette.greenText,
    implemented: true,
    image:
      "https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&q=60&auto=format&fit=crop",
    illustration: HeritageIllustration,
  },
  {
    id: "places",
    title: "Gittiğin Ülkeler",
    icon: "location-outline",
    bg: palette.greenSoft,
    fg: palette.greenText,
    implemented: true,
    image:
      "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=400&q=60&auto=format&fit=crop",
  },
  {
    id: "cuisine",
    title: "Mutfaklar",
    icon: "restaurant-outline",
    bg: palette.coralPale,
    fg: palette.coralText,
    implemented: true,
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=60&auto=format&fit=crop",
  },
  {
    id: "books",
    title: "Kitaplar",
    icon: "book-outline",
    bg: palette.violetPale,
    fg: palette.violetText,
    implemented: false,
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=60&auto=format&fit=crop",
  },
  {
    id: "movies",
    title: "Filmler",
    icon: "film-outline",
    bg: palette.bluePale,
    fg: palette.blueText,
    implemented: false,
    image:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=60&auto=format&fit=crop",
  },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
