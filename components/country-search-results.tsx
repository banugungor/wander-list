import { ProgressRow } from "@/components/progress-row";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import type { ReactNode } from "react";
import { FlatList, Text } from "react-native";

export type CountrySearchRow = {
  key: string;
  title: string;
  leading?: ReactNode;
  done: number;
  total: number;
  onPress: () => void;
};

type CountrySearchResultsProps = {
  rows: CountrySearchRow[];
  accentColor: string;
};

/** Flat country list shown by a category's continent picker while its search
 * box is non-empty, so a country can be found without first picking its
 * continent. Each picker builds its own `rows` (the data sources differ) but
 * they all render through this one list. */
export function CountrySearchResults({ rows, accentColor }: CountrySearchResultsProps) {
  const { t } = useLanguage();
  return (
    <FlatList
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      data={rows}
      keyExtractor={(row) => row.key}
      ListEmptyComponent={
        <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
          {t("explore.noResults")}
        </Text>
      }
      renderItem={({ item }) => (
        <ProgressRow
          leading={item.leading}
          title={item.title}
          fractionLabel={`${item.done}/${item.total}`}
          percent={item.total > 0 ? Math.round((item.done / item.total) * 100) : 0}
          accentColor={accentColor}
          onPress={item.onPress}
        />
      )}
    />
  );
}
