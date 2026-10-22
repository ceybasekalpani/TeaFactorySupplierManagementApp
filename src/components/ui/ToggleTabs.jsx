import { TouchableOpacity, View } from "react-native";
import { Text } from "../Text";
import { useTheme } from "../../hooks/useTheme";

export function ToggleTabs({ tabs, activeTab, onSelect }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    }}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              minHeight: 52,
              paddingVertical: 10,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              backgroundColor: active ? colors.primary : "transparent",
            }}
          >
            <Text adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.72} style={{
              color: active ? colors.white : colors.textSecondary,
              fontWeight: active ? "700" : "500",
              fontSize: fs.sm,
              textAlign: "center",
              flexShrink: 1,
              minWidth: 0,
              width: "100%",
              alignSelf: "stretch",
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
