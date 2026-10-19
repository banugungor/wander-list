import { ChipPicker } from "@/components/chip-picker";
import { CountryFlag } from "@/components/country-flag";
import { CountryPickerContent } from "@/components/country-picker-modal";
import { ItemSearchRowView } from "@/components/item-search-row";
import { ModalOverlay } from "@/components/modal-overlay";
import { SearchBar } from "@/components/search-bar";
import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import { isIslandsUnlocked } from "@/data/subscription";
import {
  ACTIVITY_REF_CATEGORIES,
  findCountry,
  type ActivityRef,
  type ActivityRefCategory,
} from "@/data/trips";
import { useTripActivityOptions, type ActivityOption } from "@/hooks/use-trip-activity-options";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** What the picker hands back: the text to show, plus where it came from
 * when it was picked from a list (hand-typed ones have no `ref`). */
export type ActivityDraft = { text: string; ref?: ActivityRef };

type Props = {
  visible: boolean;
  /** Shown under the title, e.g. "Gün 2". */
  dayLabel: string;
  /** The trip's own country; the list starts filtered to it until the user
   * picks a country themselves. */
  initialCountryId: string | null;
  onClose: () => void;
  onSubmit: (drafts: ActivityDraft[]) => void;
  /** A locked (members-only) list was tapped. The parent has to close this
   * modal and open the paywall — iOS can't present the paywall over a Modal. */
  onNeedMembership: () => void;
};

const MAX_ACTIVITY_LENGTH = 200;

const optionKey = (ref: ActivityRef) => `${ref.category}:${ref.id}`;

/** "+ Aktivite ekle" on a trip day: write your own text, and/or tick items
 * from the Heritage / Landmarks / Cuisine / Islands lists, then add them all
 * at once. The list can be limited to one country with the pill under the
 * chips — a trip can span several countries, so it's the picker's own filter
 * (remembered while the screen is open) rather than the trip's single
 * country. The country list opens as an overlay inside this Modal, not a
 * second Modal (see modal-overlay.tsx). */
export function TripActivityPicker({
  visible,
  dayLabel,
  initialCountryId,
  onClose,
  onSubmit,
  onNeedMembership,
}: Props) {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<ActivityRefCategory>("heritage");
  const [search, setSearch] = useState("");
  const [customText, setCustomText] = useState("");
  // Ticked items across every list, keyed by `category:id`, so switching
  // list doesn't drop what was already picked.
  const [selected, setSelected] = useState<Map<string, ActivityOption>>(new Map());
  // null until the user picks (or clears) a country themselves — until then
  // the trip's own country applies.
  const [pickedCountry, setPickedCountry] = useState<{ id: string | null } | null>(null);
  const [choosingCountry, setChoosingCountry] = useState(false);
  const [islandsOpen, setIslandsOpen] = useState<boolean | null>(null);

  const countryId = pickedCountry ? pickedCountry.id : initialCountryId;
  const country = findCountry(countryId);

  // Re-check membership each time the picker opens (a purchase may have just
  // gone through on the paywall).
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    isIslandsUnlocked()
      .then((open) => !cancelled && setIslandsOpen(open))
      .catch((e) => console.log("ISLANDS UNLOCK CHECK ERROR", e));
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const { options, loading } = useTripActivityOptions({
    category,
    countryId,
    search,
    language,
    enabled: visible,
  });

  const trimmedCustom = customText.trim();
  const count = selected.size + (trimmedCustom ? 1 : 0);

  const reset = () => {
    setSelected(new Map());
    setCustomText("");
    setSearch("");
    setChoosingCountry(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (count === 0) return;
    const drafts: ActivityDraft[] = [...selected.values()].map((option) => ({
      text: option.title,
      ref: option.ref,
    }));
    if (trimmedCustom) drafts.push({ text: trimmedCustom });
    reset();
    onSubmit(drafts);
  };

  const toggle = async (option: ActivityOption) => {
    const key = optionKey(option.ref);
    if (selected.has(key)) {
      setSelected((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
      return;
    }
    if (option.ref.category === "islands") {
      const open = islandsOpen ?? (await isIslandsUnlocked().catch(() => false));
      if (!open) {
        // Ticked items stay (the picker keeps its state) for when the user
        // comes back from the paywall.
        onNeedMembership();
        return;
      }
    }
    setSelected((current) => new Map(current).set(key, option));
  };

  const categoryOptions = ACTIVITY_REF_CATEGORIES.map((id) => {
    const meta = getCategory(id);
    return { value: id, label: meta ? t(meta.titleKey) : id };
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      // Android's back button steps out of the country list first.
      onRequestClose={() => (choosingCountry ? setChoosingCountry(false) : close())}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: palette.cream, paddingTop: insets.top + 12 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
          }}
        >
          <View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: palette.ink }}>
              {t("trips.addActivity")}
            </Text>
            <Text style={{ fontSize: 13, color: palette.inkMuted, marginTop: 2 }}>{dayLabel}</Text>
          </View>
          <Pressable onPress={close} hitSlop={8}>
            <Ionicons name="close" size={24} color={palette.inkMuted} />
          </Pressable>
        </View>

        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            paddingHorizontal: 14,
            height: 44,
            borderRadius: 12,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.hairline,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            maxLength={MAX_ACTIVITY_LENGTH}
            placeholder={t("trips.activityPlaceholder")}
            placeholderTextColor={palette.inkFaint}
            returnKeyType="done"
            onSubmitEditing={submit}
            style={{ fontSize: 15, color: palette.ink }}
          />
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <ChipPicker
            label={t("trips.pickFromList")}
            options={categoryOptions}
            selected={category}
            onSelect={(value) => setCategory(value as ActivityRefCategory)}
          />
        </View>

        <View style={{ flexDirection: "row", marginHorizontal: 16, marginTop: 12 }}>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setChoosingCountry(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.hairline,
            }}
          >
            {country ? <CountryFlag id={country.id} iso2={country.iso2} size={14} /> : (
              <Ionicons name="earth-outline" size={15} color={palette.inkMuted} />
            )}
            <Text style={{ fontSize: 13, color: palette.ink }}>
              {country ? getLocalizedCountryName(country.name, language) : t("trips.allCountries")}
            </Text>
            <Ionicons name="chevron-down" size={13} color={palette.inkFaint} />
          </Pressable>
          {country ? (
            <Pressable
              onPress={() => setPickedCountry({ id: null })}
              hitSlop={8}
              accessibilityLabel={t("trips.allCountries")}
              style={{ justifyContent: "center", marginLeft: 8 }}
            >
              <Ionicons name="close-circle" size={20} color={palette.inkFaint} />
            </Pressable>
          ) : null}
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t("explore.searchPlaceholder")}
          style={{ marginTop: 12, marginBottom: 12 }}
        />

        {loading ? (
          <ActivityIndicator color={palette.brand} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={options}
            keyExtractor={(option) => optionKey(option.ref)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            initialNumToRender={15}
            ListEmptyComponent={
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 32,
                  marginHorizontal: 24,
                  color: palette.inkMuted,
                }}
              >
                {country && !search.trim() ? t("trips.noItemsForCountry") : t("explore.noResults")}
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = selected.has(optionKey(item.ref));
              const locked = item.ref.category === "islands" && islandsOpen === false;
              return (
                <ItemSearchRowView
                  row={{
                    key: item.key,
                    title: item.title,
                    subtitle: item.subtitle,
                    leading: item.leading,
                    trailing: (
                      <Ionicons
                        name={
                          locked
                            ? "lock-closed-outline"
                            : isSelected
                              ? "checkmark-circle"
                              : "add-circle-outline"
                        }
                        size={22}
                        color={isSelected ? palette.brand : palette.inkFaint}
                      />
                    ),
                    onPress: () => toggle(item),
                  }}
                />
              );
            }}
          />
        )}

        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: (insets.bottom > 0 ? insets.bottom : 16) + 4,
            backgroundColor: palette.cream,
            borderTopWidth: 1,
            borderTopColor: palette.hairline,
          }}
        >
          <Pressable
            onPress={submit}
            disabled={count === 0}
            style={{
              height: 48,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: count === 0 ? palette.inkFaint : palette.brand,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>
              {count === 0 ? t("trips.addActivity") : t("trips.addCount", { count })}
            </Text>
          </Pressable>
        </View>

        {choosingCountry ? (
          <ModalOverlay>
            <CountryPickerContent
              onClose={() => setChoosingCountry(false)}
              onSelect={(picked) => setPickedCountry({ id: picked.id })}
            />
          </ModalOverlay>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
