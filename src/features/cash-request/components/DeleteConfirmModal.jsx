import { Modal, TouchableOpacity, View } from "react-native";
import { Text } from "../../../components/Text";

export function DeleteConfirmModal({ colors, fs, t, deleteConfirm, deleteLoading, onCancel, onConfirm }) {
  return (
    <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", minWidth: 0, backgroundColor: colors.bg, borderRadius: 16, padding: 24 }}>
          <Text adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.72} style={{ fontSize: fs.lg, lineHeight: fs.lg * 1.35, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
            {t.confirm ?? "Confirm"}
          </Text>
          <Text style={{ fontSize: fs.sm, lineHeight: fs.sm * 1.5, color: colors.textSecondary, marginBottom: 24, flexShrink: 1 }}>
            {t.deleteConfirmMessage ?? "Are you sure you want to delete this request?"}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
            >
              <Text adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.68} style={{ width: "100%", color: colors.text, fontSize: fs.sm, lineHeight: fs.sm * 1.35, fontWeight: "600", textAlign: "center" }}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={deleteLoading}
              style={{ flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" }}
            >
              <Text adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.68} style={{ width: "100%", color: "#fff", fontSize: fs.sm, lineHeight: fs.sm * 1.35, fontWeight: "600", textAlign: "center" }}>
                {deleteLoading ? "..." : (t.delete ?? "Delete")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
