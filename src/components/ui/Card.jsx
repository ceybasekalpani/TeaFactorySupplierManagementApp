import { View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export function Card({ children, style, className }) {
  const { colors } = useTheme();
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
