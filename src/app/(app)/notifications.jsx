import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Card, EmptyState, ScreenHeader } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const iconMap = {
  success: { name: "checkmark-circle", color: "#16a34a", bgClass: "bg-[#dcfce7]", borderClass: "border-l-[#16a34a]" },
  warning: { name: "warning", color: "#d97706", bgClass: "bg-[#fef3c7]", borderClass: "border-l-[#d97706]" },
  error:   { name: "close-circle", color: "#dc2626", bgClass: "bg-[#fee2e2]", borderClass: "border-l-[#dc2626]" },
  info:    { name: "information-circle", color: "#2563eb", bgClass: "bg-[#dbeafe]", borderClass: "border-l-[#2563eb]" },
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

function SwipeableNotif({ notif, onRemove, onMarkRead, fs }) {
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
    <Animated.View className="mb-3" style={{ transform: [{ translateX }], opacity }} {...panResponder.panHandlers}>
      <TouchableOpacity onPress={() => onMarkRead(notif.id)} activeOpacity={0.9}>
        <Card
          className={`flex-row gap-3 p-3.5 ${notif.read ? "opacity-70 border-l border-l-[#e0e0e0] dark:border-l-[#333333]" : `border-l-4 ${ic.borderClass}`}`}
        >
          <View className={`h-10 w-10 items-center justify-center rounded-full ${ic.bgClass}`}>
            <Ionicons name={ic.name} size={fs.xl} color={ic.color} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className={`mr-2 flex-1 text-[13px] text-[#212121] dark:text-white ${notif.read ? "font-medium" : "font-bold"}`}>
                {notif.title}
              </Text>
              {!notif.read && <View className="h-2 w-2 rounded-full bg-[#2e7d32] dark:bg-[#66bb6a]" />}
            </View>
            <Text className="mt-0.5 text-[11px] text-[#757575] dark:text-[#b0b0b0]">{notif.message}</Text>
            <Text className="mt-1.5 text-[10px] text-[#9e9e9e]">{timeAgo(notif.createdAt)}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { fs, t } = useTheme();
  const { notifications, markNotificationRead, markAllRead, removeNotification } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    markAllRead();
  }, []);

  const handleRemove = (id) => removeNotification(id);

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <ScreenHeader title={t.notifications} onBack={() => router.back()} rightIcon="menu" onRightPress={() => setMenuOpen(true)} />

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false} 
      >
        <View className="px-4 pt-5 pb-10">
          {notifications.length === 0 ? (
            <Card><EmptyState icon="notifications-off-outline" message={t.noNotifications} /></Card>
          ) : (
            notifications.map((notif) => (
              <SwipeableNotif
                key={notif.id}
                notif={notif}
                onRemove={handleRemove}
                onMarkRead={markNotificationRead}
                fs={fs}
              />
            ))
          )}
        </View>
      </ScrollView>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="notifications" />
    </SafeAreaView>
  );
}
