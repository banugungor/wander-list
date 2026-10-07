import { CountryFlag } from "@/components/country-flag";
import { CountryPickerContent } from "@/components/country-picker-modal";
import { DateRangePicker } from "@/components/date-range-picker";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedCountryName } from "@/data/countryNamesTr";
import {
  MAX_TITLE_LENGTH,
  findCountry,
  formatDateRange,
  type TripDraft,
} from "@/data/trips";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
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

type Step = "form" | "country" | "dates";

type TripFormModalProps = {
  visible: boolean;
  mode: "create" | "edit";
  initial?: TripDraft;
  onClose: () => void;
  /** Should throw if saving fails — the form then stays open with an error. */
  onSubmit: (draft: TripDraft) => Promise<void>;
};

/** Full-screen layer shown on top of the form (inside the same Modal), with
 * a short fade-in. The country list and calendar open as these instead of as
 * separate Modals: iOS can't present a second Modal while the first is being
 * dismissed, so swapping Modals meant closing the form, waiting, and
 * reopening it — which felt like the screen was breaking. */
function Overlay({ children }: { children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity,
        backgroundColor: palette.cream,
      }}
    >
      {children}
    </Animated.View>
  );
}

const rowStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 10,
  paddingHorizontal: 14,
  height: 50,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: palette.hairlineStrong,
  backgroundColor: palette.cream,
};

export function TripFormModal({
  visible,
  mode,
  initial,
  onClose,
  onSubmit,
}: TripFormModalProps) {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [countryId, setCountryId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from `initial` each time the form opens (derived during render
  // rather than in an effect — see text-input-modal.tsx). Only `visible`
  // triggers a reset, so `initial` needn't be referentially stable.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setTitle(initial?.title ?? "");
      setCountryId(initial?.countryId ?? null);
      setStartDate(initial?.startDate ?? null);
      setEndDate(initial?.endDate ?? null);
      setStep("form");
      setError(null);
      setSubmitting(false);
    }
  }

  const openStep = (next: Step) => {
    Keyboard.dismiss();
    setStep(next);
  };

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError(t("trips.nameRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title: trimmed, countryId, startDate, endDate });
      onClose();
    } catch (e) {
      console.log("TRIP SAVE ERROR", e);
      setError(t("trips.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const country = findCountry(countryId);
  const datesLabel = formatDateRange(startDate, endDate, language);

  return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        // Android's back button should step back out of the country/calendar
        // overlay, not throw away the whole form.
        onRequestClose={() => (step === "form" ? onClose() : setStep("form"))}
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
                  {mode === "create" ? t("trips.formNewTitle") : t("trips.formEditTitle")}
                </Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={24} color={palette.inkMuted} />
                </Pressable>
              </View>

              <Text style={{ marginTop: 18, marginBottom: 6, fontSize: 13, color: palette.inkMuted }}>
                {t("trips.nameLabel")}
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t("trips.namePlaceholder")}
                placeholderTextColor={palette.inkFaint}
                maxLength={MAX_TITLE_LENGTH}
                style={[rowStyle, { fontSize: 15, color: palette.ink }]}
              />

              <Text style={{ marginTop: 14, marginBottom: 6, fontSize: 13, color: palette.inkMuted }}>
                {t("trips.countryLabel")}
              </Text>
              <Pressable onPress={() => openStep("country")} style={rowStyle}>
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
                    : t("trips.countryNone")}
                </Text>
                {country ? (
                  <Pressable
                    onPress={() => setCountryId(null)}
                    hitSlop={8}
                    accessibilityLabel={t("trips.countryClear")}
                  >
                    <Ionicons name="close-circle" size={18} color={palette.inkFaint} />
                  </Pressable>
                ) : null}
              </Pressable>

              <Text style={{ marginTop: 14, marginBottom: 6, fontSize: 13, color: palette.inkMuted }}>
                {t("trips.datesLabel")}
              </Text>
              <Pressable onPress={() => openStep("dates")} style={rowStyle}>
                <Ionicons name="calendar-outline" size={18} color={palette.inkFaint} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: datesLabel ? palette.ink : palette.inkFaint,
                  }}
                >
                  {datesLabel ?? t("trips.datesNone")}
                </Text>
              </Pressable>

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
                    {mode === "create" ? t("trips.create") : t("trips.save")}
                  </Text>
                )}
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>

        {step === "country" ? (
          <Overlay>
            <CountryPickerContent
              onClose={() => setStep("form")}
              onSelect={(picked) => setCountryId(picked.id)}
            />
          </Overlay>
        ) : null}

        {step === "dates" ? (
          <Overlay>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onClose={() => setStep("form")}
              onApply={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setStep("form");
              }}
            />
          </Overlay>
        ) : null}
      </Modal>
  );
}
