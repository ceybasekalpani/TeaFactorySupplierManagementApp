import { Modal, Text, TouchableOpacity, View } from "react-native";

export function DeleteConfirmModal({ colors, fs, t, deleteConfirm, deleteLoading, onCancel, onConfirm }) {
  return (
    <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "center", padding: 24 }}>
        <View style={{ backgroundColor: colors.bg, borderRadius: 16, padding: 24 }}>
          <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
            {t.confirm ?? "Confirm"}
          </Text>
          <Text style={{ fontSize: fs.sm, color: colors.textSecondary, marginBottom: 24 }}>
            {t.deleteConfirmMessage ?? "Are you sure you want to delete this request?"}
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}
            >
              <Text style={{ color: colors.text, fontWeight: "600" }}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={deleteLoading}
              style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#ef4444", alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {deleteLoading ? "..." : (t.delete ?? "Delete")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
