import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export function EmptyState({ icon, message }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: 32 }}>
      <Ionicons name={icon || "leaf-outline"} size={48} color={colors.textMuted} />
      <Text style={{ color: colors.textMuted, fontSize: fs.base, marginTop: 12, textAlign: "center" }}>
        {message}
      </Text>
    </View>
  );
}
