import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { Card } from "../../../components/ui";

export function StatsRow({ colors, fs, t, todayLeafData, unreadCount, totalLeaf }) {
  const router = useRouter();

  if (todayLeafData.hasSuper) {
    const items = [
      {
        label: t.normal || "Normal",
        value: todayLeafData.normalNet,
        sub: `kg · today`,
        bg: "#dcfce7",
        route: "/(app)/leaf-details?tab=monthly",
        content: <Text style={{ fontSize: 18 }}>🍃</Text>,
      },
      {
        label: t.super || "Super",
        value: todayLeafData.superNet,
        sub: `kg · today`,
        bg: "#fef9c3",
        route: "/(app)/leaf-details?tab=monthly",
        content: <Text style={{ fontSize: 18 }}>⭐</Text>,
      },
      {
        label: t.alerts || "Alerts",
        value: unreadCount,
        sub: t.unread || "unread",
        bg: "#dbeafe",
        route: "/(app)/notifications",
        content: <Ionicons name="notifications" size={18} color="#2563eb" />,
      },
    ];

    return (
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16, alignItems: "stretch" }}>
        {items.map((item) => (
          <TouchableOpacity key={item.label} style={{ flex: 1 }} onPress={() => router.push(item.route)} activeOpacity={0.8}>
            <View style={{
              flex: 1, backgroundColor: colors.card, borderRadius: 16,
              borderWidth: 1, borderColor: colors.cardBorder,
              alignItems: "center", justifyContent: "center",
              paddingVertical: 14, paddingHorizontal: 4,
            }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: item.bg, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                {item.content}
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 9, textAlign: "center" }}>{item.label}</Text>
              <Text style={{ color: colors.text, fontSize: fs.lg, fontWeight: "800", marginTop: 2 }}>{item.value}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 9 }}>{item.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 16 }}>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push("/(app)/leaf-details?tab=monthly")} activeOpacity={0.8}>
        <Card style={{ alignItems: "center", paddingVertical: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 22 }}>🍃</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: fs.xs, textAlign: "center" }}>{t.totalLeaf}</Text>
          <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "800", marginTop: 2 }}>{totalLeaf}</Text>
          <Text style={{ color: colors.textMuted, fontSize: fs.xs }}>{t.kgToday || "kg · today"}</Text>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push("/(app)/notifications")} activeOpacity={0.8}>
        <Card style={{ alignItems: "center", paddingVertical: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <Ionicons name="notifications" size={22} color="#2563eb" />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: fs.xs, textAlign: "center" }}>{t.notifications}</Text>
          <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "800", marginTop: 2 }}>{unreadCount}</Text>
          <Text style={{ color: colors.textMuted, fontSize: fs.xs }}>{t.unread}</Text>
        </Card>
      </TouchableOpacity>
    </View>
  );
}
