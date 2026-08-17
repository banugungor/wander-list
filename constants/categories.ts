import { palette } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";

export type CategoryId = "heritage" | "places" | "cuisine" | "islands" | "capitals";

export type Category = {
  id: CategoryId;
  /** Key into translations.ts under `category.*` — resolve with `t(category.titleKey)`. */
  titleKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  bgTo: string;
  fg: string;
  implemented: boolean;
};

export const categories: Category[] = [
  {
    id: "heritage",
    titleKey: "category.heritage",
    icon: "business-outline",
    bg: palette.greenSoft,
    bgTo: palette.greenSoftDeep,
    fg: palette.greenText,
    implemented: true,
  },
  {
    id: "places",
    titleKey: "category.places",
    icon: "location-outline",
    bg: palette.greenSoft,
    bgTo: palette.greenSoftDeep,
    fg: palette.greenText,
    implemented: true,
  },
  {
    id: "cuisine",
    titleKey: "category.cuisine",
    icon: "restaurant-outline",
    bg: palette.coralPale,
    bgTo: palette.coralPaleDeep,
    fg: palette.coralText,
    implemented: true,
  },
  {
    id: "islands",
    titleKey: "category.islands",
    icon: "boat-outline",
    bg: palette.violetPale,
    bgTo: palette.violetPaleDeep,
    fg: palette.violetText,
    implemented: false,
  },
  {
    id: "capitals",
    titleKey: "category.capitals",
    icon: "flag-outline",
    bg: palette.bluePale,
    bgTo: palette.bluePaleDeep,
    fg: palette.blueText,
    implemented: false,
  },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
