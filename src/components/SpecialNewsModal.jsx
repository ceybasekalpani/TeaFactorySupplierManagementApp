import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function SpecialNewsModal({ news, visible, onClose }) {
  const { fs, t } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= (news?.length ?? 0)) {
      setCurrentIndex(0);
    }
  }, [currentIndex, news?.length]);

  if (!news || news.length === 0 || !visible) return null;

  const current = news[currentIndex];
  const body = current?.message || current?.content || current?.description || "";

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => onClose(current?.id)}>
      <View className="flex-1 justify-center bg-black/55 p-6">
        <View className="max-h-[420px] overflow-hidden rounded-[20px] border-[1.5px] border-[#ef9a9a] bg-white shadow-lg">
          <View className="flex-row items-center justify-between bg-[#920704] px-5 py-4">
            <View className="flex-row items-center gap-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Ionicons name="megaphone" size={fs.lg} color="#fff" />
              </View>
              <View>
                <Text className="text-[17px] font-extrabold tracking-[0.5px] text-white">
                  {t.specialNews}
                </Text>
                <Text className="mt-px text-[11px] text-white/75">
                  {t.importantAnnouncement}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => onClose(current?.id)}
              className="h-[30px] w-[30px] items-center justify-center rounded-full bg-white/25"
            >
              <Ionicons name="close" size={fs.md} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView className="bg-[#ffebee] p-5">
            {!!current?.title && (
              <Text className="mb-3 text-[18px] font-extrabold text-[#920704]">
                {current.title}
              </Text>
            )}

            <View className="mb-1 flex-row items-start gap-2.5">
              <View className="mt-0.5">
                <Ionicons name="alert-circle" size={fs.lg} color="#920704" />
              </View>
              <Text className="flex-1 text-[15px] font-medium leading-[25px] text-[#1a1a1a]">
                {body}
              </Text>
            </View>
          </ScrollView>

          <View className="flex-row items-center justify-between border-t border-[#e5e7eb] bg-white p-4">
            {news.length > 1 ? (
              <View className="flex-row items-center gap-2">
                {news.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setCurrentIndex(i)}>
                    <View className={`h-2 rounded ${i === currentIndex ? "w-5 bg-[#920704]" : "w-2 bg-[#d1d5db]"}`} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : <View />}

            <TouchableOpacity
              onPress={() => onClose(current?.id)}
              className="rounded-[10px] bg-[#920704] px-6 py-2.5 shadow-sm"
            >
              <Text className="text-[13px] font-bold text-white">
                {t.close}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
