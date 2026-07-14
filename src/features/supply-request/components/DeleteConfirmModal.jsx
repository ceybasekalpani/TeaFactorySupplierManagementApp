import { Modal, Text, TouchableOpacity, View } from "react-native";

const titleText = "text-[19px] font-bold text-[#212121] dark:text-white";
const mutedText = "text-[11px] text-[#757575] dark:text-[#b0b0b0]";

export function DeleteConfirmModal({ t, deleteConfirm, deleteLoading, onCancel, onConfirm }) {
  return (
    <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-center bg-black/60 p-6">
        <View className="rounded-2xl bg-[#f5f1ea] p-6 dark:bg-[#121212]">
          <Text className={titleText}>
            {t.confirm ?? "Confirm"}
          </Text>
          <Text className={`${mutedText} mb-6 mt-2`}>
            {t.deleteConfirmMessage ?? "Are you sure you want to delete this request?"}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 items-center rounded-[10px] border border-[#e0e0e0] p-3 dark:border-[#333333]"
            >
              <Text className="font-semibold text-[#212121] dark:text-white">{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={deleteLoading}
              className="flex-1 items-center rounded-[10px] bg-[#ef4444] p-3"
            >
              <Text className="font-semibold text-white">
                {deleteLoading ? "..." : (t.delete ?? "Delete")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
