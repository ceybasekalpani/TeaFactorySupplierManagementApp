import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { Text } from "../Text";
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
