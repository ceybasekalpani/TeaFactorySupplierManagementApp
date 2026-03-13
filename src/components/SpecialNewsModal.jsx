import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function SpecialNewsModal({ news, visible, onClose }) {
  const { colors, fs, t } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!news || news.length === 0 || !visible) return null;

  const current = news[currentIndex];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 24,
      }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          overflow: "hidden",
          maxHeight: 400,
        }}>
          {/* Header */}
          <View style={{
            backgroundColor: colors.accent,
            paddingHorizontal: 20,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="megaphone" size={fs.lg} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: fs.md }}>
                {t.specialNews}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.3)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={fs.md} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={{ padding: 20 }}>
            <Text style={{ color: colors.text, fontSize: fs.base, lineHeight: fs.base * 1.6 }}>
              {current?.message}
            </Text>
          </ScrollView>

          {/* Navigation and close */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            {news.length > 1 ? (
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                {news.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setCurrentIndex(i)}>
                    <View style={{
                      width: i === currentIndex ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: i === currentIndex ? colors.primary : colors.border,
                    }} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : <View />}

            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: fs.sm }}>
                {t.close}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}