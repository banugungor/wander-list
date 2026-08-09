import { palette } from "@/constants/palette";
import {
  getCachedHeritageImage,
  setCachedHeritageImage,
} from "@/data/heritageImageCache";
import type { HeritageItem } from "@/data/heritageSites";
import { fetchWikipediaThumbnail } from "@/data/wikipediaApi";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { View } from "react-native";

export function HeritageThumbnail({
  item,
  size = 76,
}: {
  item: HeritageItem;
  size?: number;
}) {
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const borderRadius = size >= 200 ? 20 : 18;

  useEffect(() => {
    if (item.imageUrl !== undefined) {
      setImageUrl(item.imageUrl);
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      const cached = await getCachedHeritageImage(item.id);
      if (cached !== undefined) {
        if (!cancelled) setImageUrl(cached);
        return;
      }

      const thumb = await fetchWikipediaThumbnail(item.name);
      if (!cancelled) setImageUrl(thumb);
      await setCachedHeritageImage(item.id, thumb);
    };

    resolve();

    return () => {
      cancelled = true;
    };
  }, [item.id, item.imageUrl, item.name]);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: palette.creamDeep,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name="business-outline"
        size={size >= 200 ? 48 : 24}
        color={palette.violet}
      />
    </View>
  );
}
