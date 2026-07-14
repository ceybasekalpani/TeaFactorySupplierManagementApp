import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export function Toast({ message, visible, type = "success" }) {
  const { colors, fs } = useTheme();
  if (!visible) return null;
  const bg = type === "success" ? colors.success : type === "error" ? colors.error : colors.info;
  return (
    <View style={{
      position: "absolute",
      bottom: 90,
      left: 20,
      right: 20,
      backgroundColor: bg,
      borderRadius: 12,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      zIndex: 9999,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    }}>
      <Ionicons
        name={type === "success" ? "checkmark-circle" : type === "error" ? "close-circle" : "information-circle"}
        size={fs.xl}
        color="#fff"
      />
      <Text style={{ color: "#fff", fontSize: fs.sm, flex: 1, fontWeight: "600" }}>{message}</Text>
    </View>
  );
}
