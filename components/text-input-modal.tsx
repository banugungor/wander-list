import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type TextInputModalProps = {
  visible: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel: string;
  maxLength?: number;
  /** When true an empty value can be submitted (e.g. clearing a day title). */
  allowEmpty?: boolean;
  onSubmit: (value: string) => void;
  onClose: () => void;
  /** Shows a red delete action (editing an existing item). */
  onDelete?: () => void;
  deleteLabel?: string;
};

/** A small centered dialog with one text field — the cross-platform stand-in
 * for iOS-only Alert.prompt, used to add/rename days and add/edit activities. */
export function TextInputModal({
  visible,
  title,
  initialValue = "",
  placeholder,
  submitLabel,
  maxLength = 200,
  allowEmpty = false,
  onSubmit,
  onClose,
  onDelete,
  deleteLabel,
}: TextInputModalProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState(initialValue);

  // Reset to the initial value each time the dialog opens. Done during render
  // (React's "derive state from props" pattern) rather than in an effect, so
  // there's no extra render with the stale value.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initialValue);
  }

  const trimmed = value.trim();
  const canSubmit = allowEmpty || trimmed.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          {/* Inner Pressable swallows taps so touching the card doesn't close it. */}
          <Pressable
            onPress={() => {}}
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: palette.surface,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: palette.ink }}>
              {title}
            </Text>

            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={palette.inkFaint}
              maxLength={maxLength}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                if (canSubmit) onSubmit(trimmed);
              }}
              style={{
                marginTop: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: palette.hairlineStrong,
                backgroundColor: palette.cream,
                fontSize: 15,
                color: palette.ink,
              }}
            />

            <View
              style={{
                marginTop: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {onDelete ? (
                <Pressable onPress={onDelete} hitSlop={8}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: palette.danger }}>
                    {deleteLabel}
                  </Text>
                </Pressable>
              ) : (
                <View />
              )}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: palette.inkMuted }}>
                    {t("common.cancel")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onSubmit(trimmed)}
                  disabled={!canSubmit}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: palette.brand,
                    opacity: canSubmit ? 1 : 0.4,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: palette.surface }}>
                    {submitLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
