import { ItemSearchRowView, type ItemSearchRow } from "@/components/item-search-row";
import { ProgressRow } from "@/components/progress-row";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { useMemo, type ReactNode } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

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
  /** Shown under the list (and under "no results") — e.g. the "suggest
   * something" card, since a country with no content yet can't be found here. */
  footer?: ReactNode;
  /** Individual matches (dishes, islands, landmarks, heritage sites), listed
   * in their own section under `rows`. Omit to search countries only. */
  itemRows?: ItemSearchRow[];
  /** True while the item index is still being fetched for the first time. */
  itemsLoading?: boolean;
  /** Section headings — shown only when both sections have something. */
  rowsTitle?: string;
  itemsTitle?: string;
};

type Entry =
  | { kind: "header"; key: string; title: string }
  | { kind: "row"; key: string; row: CountrySearchRow }
  | { kind: "item"; key: string; item: ItemSearchRow }
  | { kind: "loading"; key: string };

/** Flat list shown by a category's first screen while its search box is
 * non-empty: matching countries (so one can be found without first picking
 * its continent) followed by matching individual items. Each screen builds
 * its own rows (the data sources differ) but they all render through this
 * one list. */
export function CountrySearchResults({
  rows,
  accentColor,
  footer,
  itemRows,
  itemsLoading = false,
  rowsTitle,
  itemsTitle,
}: CountrySearchResultsProps) {
  const { t } = useLanguage();

  const entries = useMemo<Entry[]>(() => {
    const items = itemRows ?? [];
    const showHeaders = rows.length > 0 && items.length > 0;
    const list: Entry[] = [];

    if (showHeaders && rowsTitle) {
      list.push({ kind: "header", key: "h-rows", title: rowsTitle });
    }
    for (const row of rows) list.push({ kind: "row", key: `r-${row.key}`, row });

    if (showHeaders && itemsTitle) {
      list.push({ kind: "header", key: "h-items", title: itemsTitle });
    }
    for (const item of items) list.push({ kind: "item", key: `i-${item.key}`, item });

    if (itemsLoading && items.length === 0) list.push({ kind: "loading", key: "loading" });
    return list;
  }, [rows, itemRows, itemsLoading, rowsTitle, itemsTitle]);

  return (
    <FlatList
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      data={entries}
      keyExtractor={(entry) => entry.key}
      ListFooterComponent={footer ? <>{footer}</> : null}
      ListEmptyComponent={
        <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
          {t("explore.noResults")}
        </Text>
      }
      renderItem={({ item: entry }) => {
        switch (entry.kind) {
          case "header":
            return (
              <Text
                style={{
                  marginHorizontal: 16,
                  marginTop: 4,
                  marginBottom: 10,
                  fontSize: 11,
                  fontWeight: "700",
                  color: palette.inkMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                {entry.title}
              </Text>
            );
          case "row":
            return (
              <ProgressRow
                leading={entry.row.leading}
                title={entry.row.title}
                fractionLabel={`${entry.row.done}/${entry.row.total}`}
                percent={
                  entry.row.total > 0
                    ? Math.round((entry.row.done / entry.row.total) * 100)
                    : 0
                }
                accentColor={accentColor}
                onPress={entry.row.onPress}
              />
            );
          case "item":
            return <ItemSearchRowView row={entry.item} />;
          case "loading":
            return (
              <View style={{ alignItems: "center", marginTop: 24 }}>
                <ActivityIndicator color={palette.brand} />
              </View>
            );
        }
      }}
    />
  );
}
