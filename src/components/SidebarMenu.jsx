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
  { key: "home", label: t.home, icon: "home", route: "/(app)/home" },
  { key: "cashRequest", label: t.cashRequest, icon: "cash", route: "/(app)/cash-request" },
  { key: "fertilizerRequest", label: t.fertilizerRequest, icon: "leaf", route: "/(app)/fertilizer-request" },
  { key: "itemRequest", label: t.itemRequest, icon: "cube", route: "/(app)/item-request" },
  { key: "leafCard", label: t.leafCard, icon: "card", route: "/(app)/leaf-details" },
  { key: "monthLeafDetails", label: t.monthLeafDetails, icon: "calendar", route: "/(app)/leaf-details" },
  { key: "history", label: t.history, icon: "time", route: "/(app)/history" },
  { key: "settings", label: t.settings, icon: "settings", route: "/(app)/settings" },
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
        style={{ flex: 1, backgroundColor: "#000", opacity: fadeAnim }}
        pointerEvents="none"
      />
      <TouchableOpacity
        style={{ position: "absolute", inset: 0 }}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: MENU_WIDTH,
          backgroundColor: colors.card,
          transform: [{ translateX: slideAnim }],
          shadowColor: "#000",
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 20,
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* User Header */}
          <View style={{
            backgroundColor: colors.primary,
            padding: 24,
            paddingTop: 32,
          }}>
            {/* Close */}
            <TouchableOpacity onPress={onClose} style={{ alignSelf: "flex-end", marginBottom: 16 }}>
              <Ionicons name="close" size={fs.xl} color="#fff" />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(255,255,255,0.25)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.5)",
            }}>
              {currentUser?.image ? (
                <Image source={{ uri: currentUser.image }} style={{ width: 72, height: 72, borderRadius: 36 }} />
              ) : (
                <Ionicons name="person" size={36} color="#fff" />
              )}
            </View>

            <Text style={{ color: "#fff", fontSize: fs.lg, fontWeight: "700" }}>
              {currentUser?.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Ionicons name="card-outline" size={fs.sm} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: fs.sm }}>
                {activeReg?.regNo}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Ionicons name="map-outline" size={fs.sm} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: fs.sm }}>
                {activeReg?.route}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingVertical: 8 }}>
              {menuItems(t).map((item) => {
                const isActive = item.key === activeKey;
                const isDisabled =
                  (item.key === "cashRequest"       && !featureFlags.cash) ||
                  (item.key === "fertilizerRequest" && !featureFlags.fertilizer) ||
                  (item.key === "itemRequest"       && !featureFlags.item);
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => !isDisabled && navigate(item.route)}
                    activeOpacity={isDisabled ? 1 : 0.7}
                    disabled={isDisabled}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      marginHorizontal: 8,
                      marginVertical: 2,
                      borderRadius: 12,
                      backgroundColor: isActive ? colors.surface : "transparent",
                      opacity: isDisabled ? 0.4 : 1,
                    }}
                  >
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Ionicons
                        name={item.icon}
                        size={fs.lg}
                        color={isActive ? "#fff" : isDisabled ? colors.textMuted : colors.textSecondary}
                      />
                    </View>
                    <Text style={{
                      color: isActive ? colors.primary : isDisabled ? colors.textMuted : colors.text,
                      fontSize: fs.base,
                      fontWeight: isActive ? "700" : "500",
                      flex: 1,
                    }}>
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
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingHorizontal: 20,
              paddingVertical: 18,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              marginBottom: 8,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="log-out-outline" size={fs.lg} color={colors.error} />
            </View>
            <Text style={{ color: colors.error, fontSize: fs.base, fontWeight: "600" }}>
              {t.logout}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}