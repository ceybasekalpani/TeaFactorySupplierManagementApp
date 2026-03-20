import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

const RED = "#920704";
const RED_SOFT = "#ffebee";
const RED_BORDER = "#ef9a9a";

export default function SpecialNewsModal({ news, visible, onClose }) {
  const { fs, t } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!news || news.length === 0 || !visible) return null;

  const current = news[currentIndex];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        padding: 24,
      }}>
        <View style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          overflow: "hidden",
          maxHeight: 420,
          borderWidth: 1.5,
          borderColor: RED_BORDER,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        }}>
          {/* Header */}
          <View style={{
            backgroundColor: RED,
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Ionicons name="megaphone" size={fs.lg} color="#fff" />
              </View>
              <View>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: fs.md, letterSpacing: 0.5 }}>
                  {t.specialNews}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: fs.xs, marginTop: 1 }}>
                  Important Announcement
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "rgba(255,255,255,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={fs.md} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={{ padding: 20, backgroundColor: RED_SOFT }}>
            <View style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: 4,
            }}>
              <Ionicons name="alert-circle" size={fs.lg} color={RED} style={{ marginTop: 2 }} />
              <Text style={{
                color: "#1a1a1a",
                fontSize: fs.base,
                lineHeight: fs.base * 1.7,
                flex: 1,
                fontWeight: "500",
              }}>
                {current?.message}
              </Text>
            </View>
          </ScrollView>

          {/* Navigation and close */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
          }}>
            {news.length > 1 ? (
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                {news.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setCurrentIndex(i)}>
                    <View style={{
                      width: i === currentIndex ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: i === currentIndex ? RED : "#d1d5db",
                    }} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : <View />}

            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: RED,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 10,
                elevation: 2,
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
