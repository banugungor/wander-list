import { SearchBar } from "@/components/search-bar";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { matchesSearch } from "@/data/searchText";
import type { CityFilterOption } from "@/hooks/use-trip-activity-options";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CityPickerContentProps = {
  cities: CityFilterOption[];
  /** `CityFilterOption.key` currently applied, or null for all cities. */
  selectedKey: string | null;
  onClose: () => void;
  /** null = "all cities". */
  onSelect: (key: string | null) => void;
};

/** The searchable list of cities that have items in the picker's current
 * list, with how many each has — shown as an overlay inside the activity
 * picker's Modal (see modal-overlay.tsx), like CountryPickerContent. */
export function CityPickerContent({
  cities,
  selectedKey,
  onClose,
  onSelect,
}: CityPickerContentProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim();
    return query ? cities.filter((city) => matchesSearch(query, city.label)) : cities;
  }, [cities, search]);

  const choose = (key: string | null) => {
    onSelect(key);
    onClose();
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream, paddingTop: insets.top + 40 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: palette.ink }}>
          {t("trips.pickCity")}
        </Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={24} color={palette.inkMuted} />
        </Pressable>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t("explore.searchPlaceholder")}
        style={{ marginBottom: 12 }}
      />

      <FlatList
        contentContainerStyle={{ paddingBottom: 40 }}
        data={filtered}
        keyExtractor={(city) => city.key}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          search.trim() ? null : (
            <CityRow
              label={t("trips.allCities")}
              active={selectedKey === null}
              onPress={() => choose(null)}
            />
          )
        }
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
            {t("explore.noResults")}
          </Text>
        }
        renderItem={({ item }) => (
          <CityRow
            label={item.label}
            count={item.count}
            active={selectedKey === item.key}
            onPress={() => choose(item.key)}
          />
        )}
      />
    </View>
  );
}

function CityRow({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.hairline,
        },
        pressed && { backgroundColor: palette.surface },
      ]}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: active ? "700" : "400",
          color: active ? palette.brand : palette.ink,
        }}
      >
        {label}
      </Text>
      {count !== undefined ? (
        <Text style={{ fontSize: 13, color: palette.inkMuted }}>{count}</Text>
      ) : null}
      {active ? <Ionicons name="checkmark" size={18} color={palette.brand} /> : null}
    </Pressable>
  );
}
