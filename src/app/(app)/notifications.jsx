import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Card, EmptyState, ScreenHeader } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const iconMap = {
  success: { name: "checkmark-circle",   color: "#16a34a", bg: "#dcfce7" },
  warning: { name: "warning",             color: "#d97706", bg: "#fef3c7" },
  error:   { name: "close-circle",        color: "#dc2626", bg: "#fee2e2" },
  info:    { name: "information-circle",  color: "#2563eb", bg: "#dbeafe" },
};

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

export default function NotificationsScreen() {
  const { colors, fs, t } = useTheme();
  const { notifications, markNotificationRead, markAllRead, unreadCount } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t.notifications}
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      {/* Header bar */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 }}>
        <Text style={{ color: colors.textSecondary, fontSize: fs.xs }}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "600" }}>{t.markAllRead}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {notifications.length === 0 ? (
          <Card>
            <EmptyState icon="notifications-off-outline" message={t.noNotifications} />
          </Card>
        ) : (
          notifications.map((notif) => {
            const ic = iconMap[notif.type] || iconMap.info;
            return (
              <TouchableOpacity
                key={notif.id}
                onPress={() => markNotificationRead(notif.id)}
                activeOpacity={0.8}
              >
                <Card
                  style={{
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    opacity: notif.read ? 0.65 : 1,
                    borderLeftWidth: notif.read ? 1 : 4,
                    borderLeftColor: notif.read ? colors.cardBorder : ic.color,
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: ic.bg,
                    alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Ionicons name={ic.name} size={fs.xl} color={ic.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ flex: 1, color: colors.text, fontSize: fs.sm, fontWeight: notif.read ? "500" : "700" }}>
                        {notif.title}
                      </Text>
                      {!notif.read && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error }} />
                      )}
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 4, lineHeight: fs.xs * 1.5 }}>
                      {notif.message}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: fs.xs, marginTop: 6 }}>
                      {timeAgo(notif.createdAt)}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="notifications" />
    </SafeAreaView>
  );
}
