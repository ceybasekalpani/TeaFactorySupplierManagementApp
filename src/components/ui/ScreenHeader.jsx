import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export function ScreenHeader({ title, onBack, rightIcon, onRightPress }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    }}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={fs.xl} color={colors.text} />
        </TouchableOpacity>
      )}
      <Text style={{ flex: 1, fontSize: fs.lg, fontWeight: "700", color: colors.text }}>{title}</Text>
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={{ padding: 4 }}>
          <Ionicons name={rightIcon} size={fs.xl} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}
