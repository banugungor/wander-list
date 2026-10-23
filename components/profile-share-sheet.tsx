import {
  availableShareCards,
  ProfileShareCard,
  type ProfileShareData,
  type ShareCardId,
} from "@/components/profile-share-card";
import { ScaledShareCard } from "@/components/scaled-share-card";
import { palette } from "@/constants/palette";
import { useLanguage } from "@/contexts/language-context";
import { buildTravelTimeline } from "@/data/travelTimeline";
import { useMemo } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

const PREVIEW_SCALE = 0.4;

type Props = {
  visible: boolean;
  data: ProfileShareData;
  cardId: ShareCardId;
  onCardChange: (id: ShareCardId) => void;
  onYearChange: (year: number) => void;
  onShare: () => void;
  onClose: () => void;
};

/** Bottom sheet that lets the user pick which profile card to share: a row of
 * live previews (the real cards, scaled down), a year chooser for the year card,
 * and the share button. The share itself is done by the screen, which owns the
 * off-screen copy that gets captured. */
export function ProfileShareSheet({
  visible,
  data,
  cardId,
  onCardChange,
  onYearChange,
  onShare,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const available = useMemo(() => availableShareCards(data), [data]);
  const years = useMemo(
    () => buildTravelTimeline(data.placesIds, data.years).years.map((g) => g.year),
    [data.placesIds, data.years],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(30,27,24,0.4)",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            paddingTop: 20,
            paddingBottom: 32,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            backgroundColor: palette.cream,
          }}
        >
          <Text
            style={{
              paddingHorizontal: 20,
              fontSize: 16,
              fontWeight: "700",
              color: palette.ink,
            }}
          >
            {t("me.shareTitle")}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14, gap: 12 }}
          >
            {available.map((id) => {
              const selected = id === cardId;
              return (
                <Pressable key={id} onPress={() => onCardChange(id)}>
                  <View
                    style={{
                      padding: 3,
                      borderRadius: 17,
                      borderWidth: 2,
                      borderColor: selected ? palette.brand : "transparent",
                    }}
                  >
                    <ScaledShareCard scale={PREVIEW_SCALE}>
                      <ProfileShareCard id={id} data={data} />
                    </ScaledShareCard>
                  </View>
                  <Text
                    style={{
                      marginTop: 6,
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: selected ? "700" : "500",
                      color: selected ? palette.brand : palette.inkMuted,
                    }}
                  >
                    {t(`me.shareCard.${id}`)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {cardId === "year" && years.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}
            >
              {years.map((year) => {
                const active = year === data.year;
                return (
                  <Pressable
                    key={year}
                    onPress={() => onYearChange(year)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: active ? palette.brand : palette.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: active ? palette.surface : palette.ink,
                      }}
                    >
                      {year}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <Pressable
            onPress={onShare}
            style={({ pressed }) => [
              {
                marginHorizontal: 20,
                paddingVertical: 13,
                borderRadius: 999,
                alignItems: "center",
                backgroundColor: palette.brand,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: palette.surface }}>
              {t("me.shareAction")}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
