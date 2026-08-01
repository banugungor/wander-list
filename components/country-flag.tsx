import { flagEmoji } from "@/data/flagEmoji";
import { Image } from "expo-image";
import { Text } from "react-native";

// Territories whose flag can't be produced from the standard ISO country-code
// emoji trick (no ISO 3166-1 code assigned) get a bundled image instead.
const specialFlags: Record<string, ReturnType<typeof require>> = {
  "zz-n-cyprus": require("@/assets/images/flags/trnc.jpg"),
};

type CountryFlagProps = {
  id: string;
  iso2?: string;
  size?: number;
};

export function CountryFlag({ id, iso2, size = 18 }: CountryFlagProps) {
  const special = specialFlags[id];

  if (special) {
    return (
      <Image
        source={special}
        style={{ width: size * 1.5, height: size, borderRadius: 2 }}
        contentFit="cover"
      />
    );
  }

  return <Text style={{ fontSize: size }}>{flagEmoji(iso2)}</Text>;
}
