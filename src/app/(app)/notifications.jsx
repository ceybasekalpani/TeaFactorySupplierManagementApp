import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Animated, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Card, EmptyState, ScreenHeader } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const iconMap = {
  success: { name: "checkmark-circle", color: "#16a34a", bg: "#dcfce7" },
  warning: { name: "warning",           color: "#d97706", bg: "#fef3c7" },
  error:   { name: "close-circle",      color: "#dc2626", bg: "#fee2e2" },
  info:    { name: "information-circle", color: "#2563eb", bg: "#dbeafe" },
};

const DISMISS_THRESHOLD = 80;

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function SwipeableNotif({ notif, onRemove, onMarkRead, colors, fs }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const ic = iconMap[notif.type] || iconMap.info;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => 
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
      onPanResponderMove: (_, { dx }) => {
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx > DISMISS_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateX, { toValue: 500, duration: 200, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]).start(() => {
            if (typeof onRemove === 'function') {
              onRemove(notif.id);
            }
          });
        } 
        else {
          if (dx < -DISMISS_THRESHOLD) {
            onMarkRead(notif.id);
          }
          Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
      },
    })
  ).current;

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity, marginBottom: 12 }} {...panResponder.panHandlers}>
      <TouchableOpacity onPress={() => onMarkRead(notif.id)} activeOpacity={0.9}>
        <Card
          style={{
            flexDirection: "row",
            gap: 12,
            padding: 14,
            opacity: notif.read ? 0.7 : 1,
            borderLeftWidth: notif.read ? 1 : 4,
            borderLeftColor: notif.read ? colors.cardBorder : ic.color,
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: ic.bg }]}>
            <Ionicons name={ic.name} size={fs.xl} color={ic.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text, fontSize: fs.sm, fontWeight: notif.read ? "500" : "700" }]}>
                {notif.title}
              </Text>
              {!notif.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2 }}>{notif.message}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 6 }}>{timeAgo(notif.createdAt)}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { colors, fs, t } = useTheme();
  const { notifications, markNotificationRead, removeNotification } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleRemove = (id) => removeNotification(id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t.notifications} onBack={() => router.back()} rightIcon="menu" onRightPress={() => setMenuOpen(true)} />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        /* Added paddingTop: 20 here for the gap */
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
      >
        {notifications.length === 0 ? (
          <Card><EmptyState icon="notifications-off-outline" message={t.noNotifications} /></Card>
        ) : (
          notifications.map((notif) => (
            <SwipeableNotif
              key={notif.id}
              notif={notif}
              onRemove={handleRemove}
              onMarkRead={markNotificationRead}
              colors={colors}
              fs={fs}
            />
          ))
        )}
      </ScrollView>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="notifications" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between"},
  title: { flex: 1, marginRight: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});