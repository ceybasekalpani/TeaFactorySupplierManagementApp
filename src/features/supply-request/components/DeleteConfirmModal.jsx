import { Modal, TouchableOpacity, View } from "react-native";
import { Text } from "../../../components/Text";

const titleText = "text-[19px] font-bold text-[#212121] dark:text-white";

export function DeleteConfirmModal({ t, deleteConfirm, deleteLoading, onCancel, onConfirm }) {
  return (
    <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-center bg-black/60 p-6">
        <View className="w-full min-w-0 rounded-2xl bg-[#f5f1ea] p-6 dark:bg-[#121212]">
          <Text adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.72} className={titleText}>
            {t.confirm ?? "Confirm"}
          </Text>
          <Text className="mt-2 mb-6 text-[11px] leading-4 text-[#757575] dark:text-[#b0b0b0]" style={{ flexShrink: 1 }}>
            {t.deleteConfirmMessage ?? "Are you sure you want to delete this request?"}
          </Text>
          <View className="w-full flex-row gap-2.5">
            <TouchableOpacity
              onPress={onCancel}
              className="min-w-0 flex-1 items-center justify-center rounded-[10px] border border-[#e0e0e0] px-2 py-2.5 dark:border-[#333333]"
            >
              <Text adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.68} className="w-full text-center text-[13px] font-semibold leading-[18px] text-[#212121] dark:text-white">{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={deleteLoading}
              className="min-w-0 flex-1 items-center justify-center rounded-[10px] bg-[#ef4444] px-2 py-2.5"
            >
              <Text adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.68} style={{ width: "100%", textAlign: "center", fontSize: 13, lineHeight: 18, fontWeight: "600", color: "#fff" }}>
                {deleteLoading ? "..." : (t.delete ?? "Delete")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
