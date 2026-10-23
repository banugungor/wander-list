import { getCategory } from "@/constants/categories";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import type { Badge } from "@/data/badges";
import { SHOWCASE_SIZE } from "@/data/profileExtras";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

type Props = {
  badges: Badge[];
  /** Badge ids pinned by the user, in slot order. */
  showcaseIds: string[];
  onChange: (ids: string[]) => void;
};

/** Three slots for the badges the user wants on show. Tapping a slot opens a
 * sheet listing the badges earned so far (and a "remove" row if it's filled). */
export function BadgeShowcase({ badges, showcaseIds, onChange }: Props) {
  const { t } = useLanguage();
  const [slot, setSlot] = useState<number | null>(null);

  const earned = badges.filter((b) => b.earned);
  // A pinned badge that no longer exists/isn't earned (e.g. data was reset)
  // just renders as an empty slot.
  const slots = Array.from({ length: SHOWCASE_SIZE }, (_, i) =>
    earned.find((b) => b.id === showcaseIds[i]),
  );

  const pick = (badgeId: string | null) => {
    if (slot === null) return;
    const current = slots.flatMap((b) => (b ? [b.id] : []));
    const replaced = slots[slot]?.id;
    let next: string[];
    if (badgeId === null) next = current.filter((id) => id !== replaced);
    else if (replaced) next = current.map((id) => (id === replaced ? badgeId : id));
    else next = [...current, badgeId];
    onChange(next);
    setSlot(null);
  };

  const available = earned.filter(
    (b) => !slots.some((s, i) => s?.id === b.id && i !== slot),
  );

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {slots.map((badge, i) => {
          const category = badge ? getCategory(badge.categoryId) : null;
          return (
            <Pressable
              key={i}
              onPress={() => setSlot(i)}
              style={{
                flex: 1,
                minHeight: 104,
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
                borderRadius: 16,
                backgroundColor: badge ? category?.bg ?? palette.creamDeep : "transparent",
                borderWidth: badge ? 0 : 2,
                borderStyle: "dashed",
                borderColor: palette.inkFaint,
              }}
            >
              {badge ? (
                <>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 13,
                      backgroundColor: "rgba(255,255,255,0.7)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={category?.icon ?? "ribbon-outline"}
                      size={20}
                      color={category?.fg ?? palette.brand}
                    />
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      fontWeight: "700",
                      textAlign: "center",
                      color: palette.ink,
                    }}
                  >
                    {t(badge.titleKey)}
                  </Text>
                </>
              ) : (
                <Ionicons name="add" size={24} color={palette.inkFaint} />
              )}
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={slot !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSlot(null)}
      >
        <Pressable
          onPress={() => setSlot(null)}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(30,27,24,0.4)",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              maxHeight: "70%",
              padding: 20,
              paddingBottom: 36,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              backgroundColor: palette.cream,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: palette.ink }}>
              {t("me.showcasePickTitle")}
            </Text>
            <ScrollView style={{ marginTop: 12 }}>
              {available.length === 0 ? (
                <Text style={{ fontSize: 13, color: palette.inkMuted }}>
                  {t("me.showcaseNoBadges")}
                </Text>
              ) : (
                available.map((b) => {
                  const category = getCategory(b.categoryId);
                  return (
                    <Pressable
                      key={b.id}
                      onPress={() => pick(b.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        marginBottom: 8,
                        borderRadius: 14,
                        backgroundColor: palette.surface,
                      }}
                    >
                      <Ionicons
                        name={category?.icon ?? "ribbon-outline"}
                        size={18}
                        color={category?.fg ?? palette.brand}
                      />
                      <Text style={{ fontSize: 14, fontWeight: "600", color: palette.ink }}>
                        {t(b.titleKey)}
                      </Text>
                    </Pressable>
                  );
                })
              )}
              {slot !== null && slots[slot] ? (
                <Pressable
                  onPress={() => pick(null)}
                  style={{ padding: 12, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: palette.danger }}>
                    {t("me.showcaseRemove")}
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
