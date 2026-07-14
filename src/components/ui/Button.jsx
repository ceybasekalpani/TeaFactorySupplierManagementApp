import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export function Button({ title, onPress, variant = "primary", disabled, loading, icon, style }) {
  const { colors, fs } = useTheme();
  const bg = variant === "primary" ? colors.primary
    : variant === "secondary" ? colors.surface
    : variant === "danger" ? colors.error
    : "transparent";
  const textColor = variant === "primary" ? colors.white
    : variant === "secondary" ? colors.primary
    : variant === "danger" ? colors.white
    : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: disabled ? colors.textMuted : bg,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={fs.md} color={textColor} />}
          <Text style={{ color: textColor, fontWeight: "700", fontSize: fs.md }}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
