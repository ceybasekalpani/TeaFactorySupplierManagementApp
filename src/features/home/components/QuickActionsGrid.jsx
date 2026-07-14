import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { buildQuickActions } from "../config/quickActions";

export function QuickActionsGrid({ colors, fs, t, featureFlags }) {
  const router = useRouter();
  const quickActions = buildQuickActions(t, featureFlags);

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
      <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
        {t.quickActions || "Quick Actions"}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.route}
            onPress={() => action.enabled && router.push(action.route)}
            activeOpacity={action.enabled ? 0.75 : 1}
            disabled={!action.enabled}
            style={{
              width: "47%",
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              opacity: action.enabled ? 1 : 0.4,
            }}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: action.color + "18",
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name={action.icon} size={fs.lg} color={action.enabled ? action.color : colors.textMuted} />
            </View>
            <Text style={{ color: action.enabled ? colors.text : colors.textMuted, fontSize: fs.xs, fontWeight: "600", flex: 1 }}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
