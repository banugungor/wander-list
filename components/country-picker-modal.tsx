import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import worldData from "@/data/worldCountries.json";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Country = { id: string; name: string; iso2: string };

type CountryPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
};

export function CountryPickerModal({
  visible,
  onClose,
  onSelect,
}: CountryPickerModalProps) {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");

  const countries = worldData.countries as Country[];

  const sorted = useMemo(
    () =>
      [...countries].sort((a, b) =>
        getLocalizedCountryName(a.name, language).localeCompare(
          getLocalizedCountryName(b.name, language),
        ),
      ),
    [countries, language],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        getLocalizedCountryName(c.name, language).toLowerCase().includes(query),
    );
  }, [sorted, search, language]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.cream, paddingTop: 60 }}>
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
            {t("countryPicker.title")}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={palette.inkMuted} />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 16,
            marginBottom: 12,
            paddingHorizontal: 14,
            height: 44,
            borderRadius: 12,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.hairline,
          }}
        >
          <Ionicons name="search-outline" size={18} color={palette.inkFaint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("explore.searchPlaceholder")}
            placeholderTextColor={palette.inkFaint}
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: palette.ink }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={palette.inkFaint} />
            </Pressable>
          )}
        </View>

        <FlatList
          contentContainerStyle={{ paddingBottom: 40 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 40, color: palette.inkMuted }}>
              {t("explore.noResults")}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item);
                setSearch("");
                onClose();
              }}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.hairline,
                },
                pressed && { backgroundColor: palette.surface },
              ]}
            >
              <Text style={{ fontSize: 15, color: palette.ink }}>
                {getLocalizedCountryName(item.name, language)}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
