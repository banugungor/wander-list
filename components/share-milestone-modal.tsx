import { palette } from "@/constants/palette";
import { ScaledShareCard } from "@/components/scaled-share-card";
import { useLanguage } from "@/contexts/language-context";
import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";

const PREVIEW_SCALE = 0.55;

type ShareMilestoneModalProps = {
  /** The milestone country count to celebrate, or null to hide the popup. */
  count: number | null;
  percent: number;
  onShare: () => void;
  onClose: () => void;
  /** A non-captured copy of the share card, shown as the preview. */
  children: ReactNode;
};

/** Small centered popup shown at share milestones: a preview of the card
 * that would be shared plus Share / Later buttons. */
export function ShareMilestoneModal({
  count,
  percent,
  onShare,
  onClose,
  children,
}: ShareMilestoneModalProps) {
  const { t } = useLanguage();

  return (
    <Modal
      visible={count !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 340,
            alignItems: "center",
            padding: 20,
            borderRadius: 22,
            backgroundColor: palette.surface,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: palette.ink }}>
            {t("shareWorld.milestoneTitle", { count: count ?? 0 })}
          </Text>
          <Text
            style={{
              marginTop: 6,
              marginBottom: 14,
              fontSize: 13,
              textAlign: "center",
              color: palette.inkMuted,
            }}
          >
            {t("shareWorld.milestoneMessage", { percent })}
          </Text>

          <ScaledShareCard scale={PREVIEW_SCALE}>{children}</ScaledShareCard>

          <View style={{ marginTop: 16, width: "100%", gap: 8 }}>
            <Pressable
              onPress={onShare}
              style={({ pressed }) => [
                {
                  paddingVertical: 12,
                  borderRadius: 999,
                  alignItems: "center",
                  backgroundColor: palette.brand,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>
                {t("shareWorld.milestoneShare")}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                { paddingVertical: 10, alignItems: "center" },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={{ fontSize: 14, color: palette.inkMuted }}>
                {t("shareWorld.milestoneLater")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
