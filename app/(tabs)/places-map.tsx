import { CircularProgress } from "@/components/circular-progress";
import { CountryFlag } from "@/components/country-flag";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { WorldMap } from "@/components/world-map";
import { palette } from "@/constants/palette";
import { useLanguage, type Language } from "@/contexts/language-context";
import {
  CONTINENT_BY_COUNTRY_ID,
  ContinentId,
  CONTINENTS,
} from "@/data/continents";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { PLACES_VISITED_KEY, togglePlaceVisited } from "@/data/placesStorage";
import worldData from "@/data/worldCountries.json";
import { matchesSearch } from "@/data/searchText";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

type CountryPath = { id: string; name: string; d: string; iso2?: string };

function localizedNameOf(country: CountryPath, language: Language): string {
  return getLocalizedCountryName(country.name, language);
}

export default function PlacesMapScreen() {
  const { t, language } = useLanguage();
  const [visited, setVisited] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerFilter, setPickerFilter] = useState<"all" | "visited">("all");
  const [listFilter, setListFilter] = useState<"all" | "visited">("visited");
  const [expandedContinents, setExpandedContinents] = useState<
    Set<ContinentId>
  >(new Set());
  const countries = worldData.countries as CountryPath[];

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PLACES_VISITED_KEY).then((raw) => {
        setVisited(raw ? JSON.parse(raw) : []);
      });
    }, []),
  );

  const toggle = async (country: CountryPath) => {
    const updated = await togglePlaceVisited(
      country.id,
      { name: country.name, iso2: country.iso2 },
      visited,
    );
    setVisited(updated);
  };

  // Marking a country from a tap is low-risk (adds to the list), but
  // unmarking one from the "visited" list/grid below is easy to trigger by
  // accident and hard to undo without remembering which country it was — so
  // that specific entry point confirms before removing, unlike the map and
  // the add-country picker.
  const handleVisitedListPress = (country: CountryPath) => {
    if (!visited.includes(country.id)) {
      toggle(country);
      return;
    }
    Alert.alert(
      t("placesMap.removeConfirmTitle"),
      t("placesMap.removeConfirmMessage", {
        country: localizedNameOf(country, language),
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("placesMap.removeConfirmAction"),
          style: "destructive",
          onPress: () => toggle(country),
        },
      ],
    );
  };

  const sortByLocalizedName = useCallback(
    (a: CountryPath, b: CountryPath) =>
      localizedNameOf(a, language).localeCompare(localizedNameOf(b, language)),
    [language],
  );

  const visitedCountries = useMemo(
    () =>
      countries.filter((c) => visited.includes(c.id)).sort(sortByLocalizedName),
    [countries, visited, sortByLocalizedName],
  );

  const allSorted = useMemo(
    () => [...countries].sort(sortByLocalizedName),
    [countries, sortByLocalizedName],
  );

  const displayedCountries =
    listFilter === "all" ? allSorted : visitedCountries;

  // A couple of worldCountries.json entries (uninhabited sub-Antarctic
  // territories not covered by any continent bucket — see
  // data/continents.ts) have no entry in CONTINENT_BY_COUNTRY_ID. They still
  // need somewhere to show up here, or marking one visited would make it
  // silently vanish from this section despite still counting toward
  // visited.length — otherCountries is that catch-all.
  const { byContinent: displayedByContinent, otherCountries } = useMemo(() => {
    const map = new Map<ContinentId, CountryPath[]>();
    for (const continent of CONTINENTS) map.set(continent.id, []);
    const other: CountryPath[] = [];
    for (const c of allSorted) {
      if (listFilter === "visited" && !visited.includes(c.id)) continue;
      const continent = CONTINENT_BY_COUNTRY_ID[c.id];
      if (continent) map.get(continent)?.push(c);
      else other.push(c);
    }
    return { byContinent: map, otherCountries: other };
  }, [allSorted, listFilter, visited]);

  const pickerResults = useMemo(() => {
    return allSorted.filter((c) => {
      if (pickerFilter === "visited" && !visited.includes(c.id)) return false;
      return matchesSearch(pickerSearch, c.name, localizedNameOf(c, language));
    });
  }, [allSorted, pickerSearch, pickerFilter, visited, language]);

  const countriesByContinent = useMemo(() => {
    const map = new Map<ContinentId, CountryPath[]>();
    for (const continent of CONTINENTS) map.set(continent.id, []);
    for (const c of allSorted) {
      const continent = CONTINENT_BY_COUNTRY_ID[c.id];
      if (!continent) continue;
      if (pickerFilter === "visited" && !visited.includes(c.id)) continue;
      map.get(continent)?.push(c);
    }
    return map;
  }, [allSorted, pickerFilter, visited]);

  const toggleContinent = (id: ContinentId) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const percent =
    countries.length > 0
      ? Math.round((visited.length / countries.length) * 100)
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <ScreenHeader
          title={t("placesMap.title")}
          subtitle={t("placesMap.subtitle")}
        />

        {/* STATS ROW */}
        <View
          style={{
            marginTop: 16,
            marginHorizontal: 16,
            backgroundColor: palette.surface,
            borderRadius: 18,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: palette.shadow,
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 1,
          }}
        >
          <View
            style={{
              backgroundColor: palette.greenSoft,
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: palette.greenText,
              }}
            >
              {visited.length}
            </Text>
            <Text style={{ fontSize: 11, color: palette.greenText }}>
              {t("placesMap.countryUnit")}
            </Text>
          </View>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 13, color: palette.inkMuted }}>
              {t("placesMap.countriesDiscovered", { total: countries.length })}
            </Text>
          </View>

          <CircularProgress percent={percent} size={52} strokeWidth={6} />
        </View>

        {/* MAP — full-bleed (no side margins/card) so it reads as a large
         * map rather than a small inset illustration */}
        <WorldMap
          style={{ marginTop: 16 }}
          countries={countries}
          visited={visited}
          onPressCountry={toggle}
        />

        <View style={{ alignItems: "center", marginTop: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: palette.greenSoft,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Ionicons
              name="hand-left-outline"
              size={14}
              color={palette.greenText}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: palette.greenText,
              }}
            >
              {t("placesMap.tapToMark")}
            </Text>
          </View>
        </View>

        {/* VISITED LIST */}
        <View
          style={{
            marginTop: 24,
            marginBottom: 12,
            marginHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(
              [
                { id: "all", label: t("placesMap.filterAll") },
                { id: "visited", label: t("placesMap.filterVisited") },
              ] as const
            ).map((chip) => {
              const active = listFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setListFilter(chip.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: active ? palette.brand : palette.surface,
                    borderWidth: active ? 0 : 1,
                    borderColor: palette.hairline,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: active ? palette.surface : palette.inkMuted,
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: palette.creamDeep,
              borderRadius: 10,
              padding: 3,
              gap: 2,
            }}
          >
            <Pressable
              onPress={() => setViewMode("grid")}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor:
                  viewMode === "grid" ? palette.surface : "transparent",
              }}
            >
              <Ionicons name="grid-outline" size={15} color={palette.ink} />
            </Pressable>
            <Pressable
              onPress={() => setViewMode("list")}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor:
                  viewMode === "list" ? palette.surface : "transparent",
              }}
            >
              <Ionicons name="list-outline" size={15} color={palette.ink} />
            </Pressable>
          </View>
        </View>

        {displayedCountries.length === 0 ? (
          <Text
            style={{
              marginHorizontal: 16,
              fontSize: 13,
              color: palette.inkMuted,
            }}
          >
            {t("placesMap.noVisitedCountries")}
          </Text>
        ) : (
          <View style={{ marginHorizontal: 16, gap: 10 }}>
            {CONTINENTS.map((continent) => {
              const list = displayedByContinent.get(continent.id) ?? [];
              if (list.length === 0) return null;
              const visitedCount = list.filter((c) =>
                visited.includes(c.id),
              ).length;
              const expanded = expandedContinents.has(continent.id);

              return (
                <View key={continent.id}>
                  <Pressable
                    onPress={() => toggleContinent(continent.id)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 13,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        backgroundColor: palette.surface,
                        borderWidth: 1,
                        borderColor: palette.hairline,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: palette.ink,
                      }}
                    >
                      {language === "tr" ? continent.name : continent.nameEn}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: palette.inkMuted }}>
                        {visitedCount}/{list.length}
                      </Text>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={palette.inkMuted}
                      />
                    </View>
                  </Pressable>

                  {expanded && (
                    <View
                      style={{
                        marginTop: 10,
                        flexDirection: viewMode === "grid" ? "row" : "column",
                        flexWrap: viewMode === "grid" ? "wrap" : "nowrap",
                        gap: 10,
                      }}
                    >
                      {list.map((c) => (
                        <VisitedCountryCard
                          key={c.id}
                          country={c}
                          isVisited={visited.includes(c.id)}
                          viewMode={viewMode}
                          onPress={() => handleVisitedListPress(c)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {otherCountries.length > 0 && (
              <View
                style={{
                  flexDirection: viewMode === "grid" ? "row" : "column",
                  flexWrap: viewMode === "grid" ? "wrap" : "nowrap",
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    width: "100%",
                    fontSize: 12,
                    fontWeight: "700",
                    color: palette.inkMuted,
                  }}
                >
                  {t("placesMap.otherTerritories")}
                </Text>
                {otherCountries.map((c) => (
                  <VisitedCountryCard
                    key={c.id}
                    country={c}
                    isVisited={visited.includes(c.id)}
                    viewMode={viewMode}
                    onPress={() => handleVisitedListPress(c)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* CTA */}
        <Pressable
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [
            {
              marginTop: 24,
              marginBottom: 24,
              marginHorizontal: 16,
              backgroundColor: palette.brand,
              borderRadius: 999,
              paddingVertical: 15,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text
            style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}
          >
            {t("placesMap.addCountryCta")}
          </Text>
          <Ionicons name="add" size={18} color={palette.surface} />
        </Pressable>
      </ScrollView>

      {/* PICKER MODAL */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View
          style={{ flex: 1, backgroundColor: palette.cream, paddingTop: 20 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            <Text
              style={{ fontSize: 17, fontWeight: "700", color: palette.ink }}
            >
              {t("placesMap.pickerTitle")}
            </Text>
            <Pressable onPress={() => setPickerVisible(false)}>
              <Ionicons name="close" size={22} color={palette.inkMuted} />
            </Pressable>
          </View>

          <SearchBar
            value={pickerSearch}
            onChangeText={setPickerSearch}
            placeholder={t("placesMap.pickerSearchPlaceholder")}
            style={{ marginTop: 0, marginBottom: 12 }}
          />

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginHorizontal: 16,
              marginBottom: 12,
            }}
          >
            {(
              [
                { id: "all", label: t("placesMap.filterAll") },
                { id: "visited", label: t("placesMap.filterVisited") },
              ] as const
            ).map((chip) => {
              const active = pickerFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setPickerFilter(chip.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: active ? palette.brand : palette.surface,
                    borderWidth: active ? 0 : 1,
                    borderColor: palette.hairline,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: active ? palette.surface : palette.inkMuted,
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {pickerSearch.trim() ? (
            <FlatList
              data={pickerResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 24,
              }}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    marginTop: 40,
                    fontSize: 13,
                    color: palette.inkMuted,
                  }}
                >
                  {pickerFilter === "visited"
                    ? t("placesMap.noVisitedCountries")
                    : t("placesMap.noResults")}
                </Text>
              }
              renderItem={({ item }) => (
                <PickerCountryRow
                  country={item}
                  isVisited={visited.includes(item.id)}
                  onPress={() => toggle(item)}
                />
              )}
            />
          ) : Array.from(countriesByContinent.values()).every(
              (list) => list.length === 0,
            ) ? (
            <Text
              style={{
                textAlign: "center",
                marginTop: 40,
                fontSize: 13,
                color: palette.inkMuted,
              }}
            >
              {pickerFilter === "visited"
                ? t("placesMap.noVisitedCountries")
                : t("placesMap.noResults")}
            </Text>
          ) : (
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 24,
              }}
            >
              {CONTINENTS.map((continent) => {
                const list = countriesByContinent.get(continent.id) ?? [];
                if (list.length === 0) return null;
                const visitedCount = list.filter((c) =>
                  visited.includes(c.id),
                ).length;
                const expanded = expandedContinents.has(continent.id);

                return (
                  <View key={continent.id} style={{ marginBottom: 10 }}>
                    <Pressable
                      onPress={() => toggleContinent(continent.id)}
                      style={({ pressed }) => [
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 13,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                          backgroundColor: palette.surface,
                          borderWidth: 1,
                          borderColor: palette.hairline,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: palette.ink,
                        }}
                      >
                        {language === "tr" ? continent.name : continent.nameEn}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: palette.inkMuted }}>
                          {visitedCount}/{list.length}
                        </Text>
                        <Ionicons
                          name={expanded ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={palette.inkMuted}
                        />
                      </View>
                    </Pressable>

                    {expanded && (
                      <View
                        style={{
                          marginTop: 4,
                          borderRadius: 12,
                          overflow: "hidden",
                          backgroundColor: palette.surface,
                          borderWidth: 1,
                          borderColor: palette.hairline,
                        }}
                      >
                        {list.map((item) => (
                          <PickerCountryRow
                            key={item.id}
                            country={item}
                            isVisited={visited.includes(item.id)}
                            onPress={() => toggle(item)}
                            inset
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

function VisitedCountryCard({
  country,
  isVisited,
  viewMode,
  onPress,
}: {
  country: CountryPath;
  isVisited: boolean;
  viewMode: "grid" | "list";
  onPress: () => void;
}) {
  const { language } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: palette.surface,
          borderRadius: 14,
          paddingVertical: 10,
          paddingHorizontal: 12,
          width: viewMode === "grid" ? "31%" : "100%",
          shadowColor: palette.shadow,
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        },
        pressed && { opacity: 0.6 },
      ]}
    >
      <CountryFlag id={country.id} iso2={country.iso2} size={18} />
      <Text
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: "600",
          color: palette.ink,
        }}
        numberOfLines={1}
      >
        {localizedNameOf(country, language)}
      </Text>
      <Ionicons
        name={isVisited ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={isVisited ? palette.brand : palette.inkFaint}
      />
    </Pressable>
  );
}

function PickerCountryRow({
  country,
  isVisited,
  onPress,
  inset,
}: {
  country: CountryPath;
  isVisited: boolean;
  onPress: () => void;
  inset?: boolean;
}) {
  const { language } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          minHeight: 56,
          paddingVertical: 16,
          paddingHorizontal: inset ? 14 : 0,
          borderBottomWidth: 1,
          borderBottomColor: palette.hairline,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <CountryFlag id={country.id} iso2={country.iso2} size={24} />
      <Text style={{ flex: 1, fontSize: 16, color: palette.ink }}>
        {localizedNameOf(country, language)}
      </Text>
      <Ionicons
        name={isVisited ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={isVisited ? palette.brand : palette.inkFaint}
      />
    </Pressable>
  );
}
