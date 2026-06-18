import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions, Image,
  Modal,
  ScrollView,
  Text, TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { useTheme } from "../hooks/useTheme";

const { width } = Dimensions.get("window");
const MENU_WIDTH = width * 0.82;

const menuItems = (t) => [
  { key: "home",             label: t.home,             icon: "home",      route: "/(app)/home" },
  { key: "cashRequest",      label: t.cashRequest,      icon: "cash",      route: "/(app)/cash-request" },
  { key: "fertilizerItemRequest",    label: t.fertilizerItemRequest,   icon: "leaf",      route: "/(app)/fertilizerItem-request" },
  { key: "leafCard",         label: t.leafCard,         icon: "card",      route: "/(app)/leaf-details?tab=card" },
  { key: "monthLeafDetails", label: t.monthLeafDetails, icon: "calendar",  route: "/(app)/leaf-details?tab=monthly" },
  { key: "history",          label: t.leafAndAccountHistory, icon: "bar-chart-outline", route: "/(app)/history" },
  { key: "landInfo",         label: t.landInfo,         icon: "map",       route: "/(app)/land-info" },
  { key: "settings",         label: t.settings,         icon: "settings",  route: "/(app)/settings" },
];

export default function SidebarMenu({ visible, onClose, activeKey }) {
  const { colors, fs, t } = useTheme();
  const { currentUser, activeReg, logout, getFeatureFlags } = useApp();
  const featureFlags = getFeatureFlags();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -MENU_WIDTH, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const navigate = (route) => {
    onClose();
    setTimeout(() => router.push(route), 200);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(async () => {
      await logout();
      router.replace("/(auth)/landing");
    }, 300);
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Overlay */}
      <Animated.View
        className="flex-1 bg-black"
        style={{ opacity: fadeAnim }}
        pointerEvents="none"
      />
      <TouchableOpacity
        className="absolute inset-0"
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Drawer */}
      <Animated.View
        className="absolute bottom-0 left-0 top-0 bg-white shadow-2xl dark:bg-[#242424]"
        style={{ width: MENU_WIDTH, transform: [{ translateX: slideAnim }] }}
      >
        <SafeAreaView className="flex-1">
          {/* User Header */}
          <View className="bg-[#2e7d32] p-6 pt-8 dark:bg-[#66bb6a]">
            {/* Close */}
            <TouchableOpacity onPress={onClose} className="mb-4 self-end">
              <Ionicons name="close" size={fs.xl} color="#fff" />
            </TouchableOpacity>

            {/* Avatar */}
            <View className="mb-3 h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-white/50 bg-white/25">
              {currentUser?.image ? (
                <Image source={{ uri: currentUser.image }} className="h-[72px] w-[72px] rounded-full" />
              ) : (
                <Ionicons name="person" size={36} color="#fff" />
              )}
            </View>

            <Text className="text-[19px] font-bold text-white">
              {currentUser?.name}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Ionicons name="card-outline" size={fs.sm} color="rgba(255,255,255,0.7)" />
              <Text className="text-[13px] text-white/70">
                {activeReg?.regNo}
              </Text>
            </View>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <Ionicons name="map-outline" size={fs.sm} color="rgba(255,255,255,0.7)" />
              <Text className="text-[13px] text-white/70">
                {activeReg?.route}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="py-2">
              {menuItems(t).map((item) => {
                const isActive = item.key === activeKey;
                const isDisabled =
                  (item.key === "cashRequest"   && !featureFlags.cash) ||
                  (item.key === "supplyRequest" && !featureFlags.fertilizer && !featureFlags.item);
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => !isDisabled && navigate(item.route)}
                    activeOpacity={isDisabled ? 1 : 0.7}
                    disabled={isDisabled}
                    className={`mx-2 my-0.5 flex-row items-center gap-3.5 rounded-xl px-5 py-3.5 ${isActive ? "bg-[#f5f5f5] dark:bg-[#1e1e1e]" : "bg-transparent"} ${isDisabled ? "opacity-40" : "opacity-100"}`}
                  >
                    <View className={`h-9 w-9 items-center justify-center rounded-[10px] ${isActive ? "bg-[#2e7d32] dark:bg-[#66bb6a]" : "bg-[#f5f5f5] dark:bg-[#1e1e1e]"}`}>
                      <Ionicons
                        name={item.icon}
                        size={fs.lg}
                        color={isActive ? "#fff" : isDisabled ? colors.textMuted : colors.textSecondary}
                      />
                    </View>
                    <Text className={`flex-1 text-[15px] ${isActive ? "font-bold text-[#2e7d32] dark:text-[#66bb6a]" : isDisabled ? "font-medium text-[#9e9e9e]" : "font-medium text-[#212121] dark:text-white"}`}>
                      {item.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="chevron-forward" size={fs.base} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mb-2 flex-row items-center gap-3.5 border-t border-[#e0e0e0] px-5 py-[18px] dark:border-[#333333]"
          >
            <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-[#fee2e2]">
              <Ionicons name="log-out-outline" size={fs.lg} color={colors.error} />
            </View>
            <Text className="text-[15px] font-semibold text-[#b71c1c] dark:text-[#ef5350]">
              {t.logout}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}
