import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { Card } from "../../../components/ui";
import { notificationIconMap } from "../config/quickActions";
import { timeAgo } from "../utils/timeAgo";

export function RecentNotificationsList({ colors, fs, t, notifications }) {
  const router = useRouter();
  const recentNotifications = notifications.slice(0, 3);

  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text }}>
          {t.notificationsAndNews}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(app)/notifications")}>
          <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "600" }}>{t.viewAll}</Text>
        </TouchableOpacity>
      </View>

      {recentNotifications.length === 0 ? (
        <Card>
          <Text style={{ color: colors.textMuted, textAlign: "center", fontSize: fs.sm, paddingVertical: 8 }}>
            {t.noNotifications}
          </Text>
        </Card>
      ) : (
        recentNotifications.map((notif) => {
          const ic = notificationIconMap[notif.type] || notificationIconMap.info;
          return (
            <TouchableOpacity
              key={notif.id}
              onPress={() => router.push("/(app)/notifications")}
              activeOpacity={0.8}
            >
              <Card style={{
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                borderLeftWidth: notif.read ? 1 : 3,
                borderLeftColor: notif.read ? colors.cardBorder : ic.color,
                opacity: notif.read ? 0.7 : 1,
              }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: ic.bg,
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Ionicons name={ic.name} size={fs.lg} color={ic.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: colors.text, fontSize: fs.sm, fontWeight: notif.read ? "500" : "700", flex: 1 }}>
                      {notif.title}
                    </Text>
                    {!notif.read && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error }} />
                    )}
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2, lineHeight: fs.xs * 1.5 }}>
                    {notif.message}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: fs.xs, marginTop: 4 }}>
                    {timeAgo(notif.createdAt, t)}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}
