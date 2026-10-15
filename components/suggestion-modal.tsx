import { CountryFlag } from "@/components/country-flag";
import { CountryPickerContent } from "@/components/country-picker-modal";
import { ModalOverlay } from "@/components/modal-overlay";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import {
  MAX_SUGGESTION_CITY_LENGTH,
  MAX_SUGGESTION_DESCRIPTION_LENGTH,
  MAX_SUGGESTION_NAME_LENGTH,
  SuggestionLimitError,
  submitSuggestion,
  suggestionHasCity,
  type SuggestionCategory,
} from "@/data/suggestions";
import {
  pickSuggestionPhoto,
  SuggestionPhotoTooLargeError,
  type SuggestionPhoto,
} from "@/data/suggestionPhoto";
import { findCountry } from "@/data/trips";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SuggestionModalProps = {
  visible: boolean;
  category: SuggestionCategory;
  /** Country the suggestion is for. When set (opened from a country's own
   * list) it's fixed; when null the user picks one — needed because the
   * category pickers hide countries with no content yet, which are exactly
   * the ones people want to fill in. */
  countryId: string | null;
  /** `heritage_photo` only: the site the photo is for. Fixed, like a locked
   * country. */
  heritageSite?: { id: string; name: string } | null;
  /** Landmarks/cuisine/islands: an existing entry (row id + English name)
   * the photo is for. The form then only asks for the photo. */
  existingEntry?: { id: string; name: string } | null;
  onClose: () => void;
};

const rowStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 10,
  paddingHorizontal: 14,
  minHeight: 50,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: palette.hairlineStrong,
  backgroundColor: palette.cream,
};

const labelStyle = {
  marginTop: 14,
  marginBottom: 6,
  fontSize: 13,
  color: palette.inkMuted,
};

export function SuggestionModal({
  visible,
  category,
  countryId: presetCountryId,
  heritageSite = null,
  existingEntry = null,
  onClose,
}: SuggestionModalProps) {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [pickedCountryId, setPickedCountryId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<SuggestionPhoto | null>(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [pickingCountry, setPickingCountry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from an empty form each time it opens (derived during render
  // rather than in an effect — see text-input-modal.tsx).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setPickedCountryId(null);
      setName("");
      setCity("");
      setDescription("");
      setPhoto(null);
      setPickingPhoto(false);
      setAccepted(false);
      setPickingCountry(false);
      setSubmitting(false);
      setDone(false);
      setError(null);
    }
  }

  const country = findCountry(presetCountryId ?? pickedCountryId);
  const countryLocked = presetCountryId !== null;
  const hasCity = suggestionHasCity(category);
  // A heritage photo suggestion is just "this photo, for this site": no
  // country/name/city/description to fill in, and the photo is the point.
  const isHeritagePhoto = category === "heritage_photo";
  // Same for a photo sent for an existing dish/island/landmark.
  const isEntryPhoto = existingEntry !== null;
  const photoOnly = isHeritagePhoto || isEntryPhoto;

  const choosePhoto = async () => {
    if (pickingPhoto) return;
    Keyboard.dismiss();
    setPickingPhoto(true);
    setError(null);
    try {
      const picked = await pickSuggestionPhoto();
      if (picked) setPhoto(picked);
    } catch (e) {
      console.log("SUGGESTION PHOTO PICK ERROR", e);
      setError(
        e instanceof SuggestionPhotoTooLargeError
          ? t("suggest.photoTooLarge")
          : t("suggest.photoFailed"),
      );
    } finally {
      setPickingPhoto(false);
    }
  };

  const submit = async () => {
    const trimmedName = name.trim();
    if (photoOnly) {
      if (!(isHeritagePhoto ? heritageSite : existingEntry)) return;
      if (!photo) {
        setError(t("suggest.photoRequired"));
        return;
      }
    } else {
      if (!country) {
        setError(t("suggest.countryRequired"));
        return;
      }
      if (!trimmedName) {
        setError(t("suggest.nameRequired"));
        return;
      }
    }
    if (!accepted) {
      setError(t("suggest.consentRequired"));
      return;
    }
    Keyboard.dismiss();
    setSubmitting(true);
    setError(null);
    try {
      await submitSuggestion(
        isHeritagePhoto && heritageSite
          ? {
              category,
              countryId: null,
              heritageSiteId: heritageSite.id,
              name: heritageSite.name,
              city: null,
              description: null,
              photo,
            }
          : existingEntry && country
            ? {
                category,
                countryId: country.id,
                targetId: existingEntry.id,
                name: existingEntry.name,
                city: null,
                description: null,
                photo,
              }
            : {
                category,
                countryId: country?.id ?? null,
                name: trimmedName,
                city: hasCity ? city.trim() || null : null,
                description: description.trim() || null,
                photo,
              },
      );
      setDone(true);
    } catch (e) {
      console.log("SUGGESTION SUBMIT ERROR", e);
      setError(
        e instanceof SuggestionLimitError ? t("suggest.limitReached") : t("suggest.sendFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // Android's back button should step back out of the country overlay,
      // not throw away the whole form.
      onRequestClose={() => (pickingCountry ? setPickingCountry(false) : onClose())}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              maxHeight: "92%",
              backgroundColor: palette.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: (insets.bottom > 0 ? insets.bottom : 16) + 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: palette.ink }}>
                {t(isEntryPhoto ? `suggest.${category}.photoTitle` : `suggest.${category}.title`)}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color={palette.inkMuted} />
              </Pressable>
            </View>

            {done ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Ionicons name="checkmark-circle" size={56} color={palette.brand} />
                <Text
                  style={{
                    marginTop: 12,
                    fontSize: 17,
                    fontWeight: "700",
                    color: palette.ink,
                  }}
                >
                  {t("suggest.thanksTitle")}
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    lineHeight: 20,
                    textAlign: "center",
                    color: palette.inkMuted,
                  }}
                >
                  {t("suggest.thanksBody")}
                </Text>
                <Pressable
                  onPress={onClose}
                  style={{
                    marginTop: 20,
                    alignSelf: "stretch",
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: palette.brand,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>
                    {t("common.ok")}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={{ marginTop: 8, fontSize: 13, lineHeight: 19, color: palette.inkMuted }}>
                  {t(isEntryPhoto ? `suggest.${category}.photoIntro` : `suggest.${category}.intro`)}
                </Text>

                {photoOnly ? (
                  <>
                    <Text style={labelStyle}>
                      {t(isHeritagePhoto ? "suggest.heritage_photo.siteLabel" : `suggest.${category}.nameLabel`)}
                    </Text>
                    <View style={rowStyle}>
                      <Ionicons name="business-outline" size={18} color={palette.inkFaint} />
                      <Text style={{ flex: 1, fontSize: 15, color: palette.ink }} numberOfLines={2}>
                        {isHeritagePhoto ? heritageSite?.name : existingEntry?.name}
                      </Text>
                    </View>

                  </>
                ) : (
                  <>
                    <Text style={labelStyle}>{t("suggest.countryLabel")}</Text>
                    <Pressable
                      onPress={() => {
                        if (countryLocked) return;
                        Keyboard.dismiss();
                        setPickingCountry(true);
                      }}
                      style={rowStyle}
                    >
                      {country ? (
                        <CountryFlag id={country.id} iso2={country.iso2} size={20} />
                      ) : (
                        <Ionicons name="flag-outline" size={18} color={palette.inkFaint} />
                      )}
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 15,
                          color: country ? palette.ink : palette.inkFaint,
                        }}
                        numberOfLines={1}
                      >
                        {country
                          ? getLocalizedCountryName(country.name, language)
                          : t("suggest.countryNone")}
                      </Text>
                      {countryLocked ? null : (
                        <Ionicons name="chevron-forward" size={16} color={palette.inkFaint} />
                      )}
                    </Pressable>

                    <Text style={labelStyle}>{t(`suggest.${category}.nameLabel`)}</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder={t(`suggest.${category}.namePlaceholder`)}
                      placeholderTextColor={palette.inkFaint}
                      maxLength={MAX_SUGGESTION_NAME_LENGTH}
                      style={[rowStyle, { height: 50, fontSize: 15, color: palette.ink }]}
                    />

                    {hasCity ? (
                      <>
                        <Text style={labelStyle}>{t(`suggest.${category}.cityLabel`)}</Text>
                        <TextInput
                          value={city}
                          onChangeText={setCity}
                          placeholder={t(`suggest.${category}.cityPlaceholder`)}
                          placeholderTextColor={palette.inkFaint}
                          maxLength={MAX_SUGGESTION_CITY_LENGTH}
                          style={[rowStyle, { height: 50, fontSize: 15, color: palette.ink }]}
                        />
                      </>
                    ) : null}

                    <Text style={labelStyle}>{t("suggest.descriptionLabel")}</Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder={t("suggest.descriptionPlaceholder")}
                      placeholderTextColor={palette.inkFaint}
                      maxLength={MAX_SUGGESTION_DESCRIPTION_LENGTH}
                      multiline
                      textAlignVertical="top"
                      style={[
                        rowStyle,
                        {
                          minHeight: 96,
                          paddingTop: 12,
                          paddingBottom: 12,
                          alignItems: "flex-start",
                          fontSize: 15,
                          color: palette.ink,
                        },
                      ]}
                    />

                  </>
                )}

                <Text style={labelStyle}>
                  {t(photoOnly ? "suggest.photoLabelRequired" : "suggest.photoLabel")}
                </Text>
                {photo ? (
                  <View>
                    <Image
                      source={{ uri: photo.uri }}
                      contentFit="cover"
                      style={{ height: 180, borderRadius: 12, backgroundColor: palette.cream }}
                    />
                    <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                      <Pressable onPress={choosePhoto} hitSlop={6}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: palette.brand }}>
                          {t("suggest.photoChange")}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => setPhoto(null)} hitSlop={6}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: palette.danger }}>
                          {t("suggest.photoRemove")}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={choosePhoto}
                    disabled={pickingPhoto}
                    style={[
                      rowStyle,
                      {
                        height: 90,
                        justifyContent: "center",
                        borderStyle: "dashed",
                        opacity: pickingPhoto ? 0.6 : 1,
                      },
                    ]}
                  >
                    {pickingPhoto ? (
                      <ActivityIndicator color={palette.brand} />
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={22} color={palette.brand} />
                        <Text style={{ fontSize: 15, fontWeight: "600", color: palette.brand }}>
                          {t("suggest.photoPick")}
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}

                <Pressable
                  onPress={() => setAccepted((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: accepted }}
                  style={{ flexDirection: "row", gap: 10, marginTop: 18 }}
                >
                  <Ionicons
                    name={accepted ? "checkbox" : "square-outline"}
                    size={22}
                    color={accepted ? palette.brand : palette.inkMuted}
                  />
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: palette.ink }}>
                    {t("suggest.consentLabel")}
                  </Text>
                </Pressable>
                <Text
                  style={{
                    marginTop: 6,
                    marginLeft: 32,
                    fontSize: 12,
                    lineHeight: 17,
                    color: palette.inkMuted,
                  }}
                >
                  {t("suggest.consentDetail")}
                </Text>

                {error ? (
                  <Text style={{ marginTop: 12, fontSize: 13, color: palette.danger }}>{error}</Text>
                ) : null}

                <Pressable
                  onPress={submit}
                  disabled={submitting}
                  style={{
                    marginTop: 20,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: palette.brand,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator color={palette.surface} />
                  ) : (
                    <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>
                      {t("suggest.send")}
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      {pickingCountry ? (
        <ModalOverlay>
          <CountryPickerContent
            onClose={() => setPickingCountry(false)}
            onSelect={(picked) => setPickedCountryId(picked.id)}
          />
        </ModalOverlay>
      ) : null}
    </Modal>
  );
}
