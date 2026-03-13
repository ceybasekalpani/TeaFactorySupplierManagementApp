import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import SpecialNewsModal from "../../components/SpecialNewsModal";
import { Card } from "../../components/ui";
import { useTheme } from "../../hooks/useTheme";
import { useApp } from "../../context/AppContext";

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t.goodMorning;
  if (h < 17) return t.goodAfternoon;
  return t.goodEvening;
}

export default function HomeScreen() {
  const { colors, fs, t } = useTheme();
  const { currentUser, activeReg, notifications, unreadCount, getTodayLeaf, specialNews, newsShown, setNewsShown } = useApp();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [newsVisible, setNewsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    if (!newsShown && specialNews.length > 0) {
      const timer = setTimeout(() => {
        setNewsVisible(true);
        setNewsShown(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const totalLeaf = getTodayLeaf();
  const recentNotifications = notifications.slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="menu" size={fs["2xl"]} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fs.lg, fontWeight: "800", color: colors.text }}>
            🍃 Tea Factory
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(app)/notifications")}
          style={{ padding: 4, position: "relative" }}
        >
          <Ionicons name="notifications" size={fs.xl} color={colors.text} />
          {unreadCount > 0 && (
            <View style={{
              position: "absolute",
              top: 0,
              right: 0,
              backgroundColor: colors.error,
              width: 18,
              height: 18,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Welcome Banner */}
        <View style={{
          margin: 16,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: colors.primary,
        }}>
          <View style={{ padding: 20 }}>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: fs.sm }}>
              {getGreeting(t)},
            </Text>
            <Text style={{ color: "#fff", fontSize: fs["2xl"], fontWeight: "800", marginTop: 2 }}>
              {currentUser?.name} 👋
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
              <View style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}>
                <Ionicons name="card-outline" size={fs.sm} color="#fff" />
                <Text style={{ color: "#fff", fontSize: fs.xs, fontWeight: "600" }}>
                  Sup No: {currentUser?.id}
                </Text>
              </View>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: fs.xs, marginTop: 8 }}>
              {dateStr}
            </Text>
          </View>

          {/* Decorative leaf shapes */}
          <View style={{
            position: "absolute",
            right: -20,
            top: -20,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "rgba(255,255,255,0.08)",
          }} />
          <View style={{
            position: "absolute",
            right: 20,
            bottom: -30,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.06)",
          }} />
        </View>

        {/* Stats Cards */}
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 16 }}>
          {/* Total Leaf */}
          <Card style={{ flex: 1, alignItems: "center" }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 24 }}>🍃</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: fs.xs, textAlign: "center" }}>
              {t.totalLeaf}
            </Text>
            <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "800", marginTop: 2 }}>
              {totalLeaf}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: fs.xs }}>kg (this month)</Text>
          </Card>

          {/* Route */}
          <Card style={{ flex: 1, alignItems: "center" }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}>
              <Ionicons name="map" size={24} color={colors.primary} />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: fs.xs, textAlign: "center" }}>
              Route
            </Text>
            <Text style={{ color: colors.text, fontSize: fs.sm, fontWeight: "700", marginTop: 2, textAlign: "center" }}>
              {activeReg?.route?.split(" - ")[0]}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: fs.xs, textAlign: "center" }}>
              {activeReg?.route?.split(" - ")[1]}
            </Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[
              { label: t.cashRequest, icon: "cash", route: "/(app)/cash-request", color: "#22c55e" },
              { label: t.fertilizerRequest, icon: "leaf", route: "/(app)/fertilizer-request", color: "#0891b2" },
              { label: t.itemRequest, icon: "cube", route: "/(app)/item-request", color: "#d97706" },
              { label: t.leafCard, icon: "card", route: "/(app)/leaf-details", color: "#7c3aed" },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(action.route)}
                activeOpacity={0.8}
                style={{
                  width: "47%",
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: action.color + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Ionicons name={action.icon} size={fs.lg} color={action.color} />
                </View>
                <Text style={{ color: colors.text, fontSize: fs.xs, fontWeight: "600", flex: 1 }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications & News */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
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
              <Text style={{ color: colors.textMuted, textAlign: "center", fontSize: fs.sm }}>
                {t.noNotifications}
              </Text>
            </Card>
          ) : (
            recentNotifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                onPress={() => router.push("/(app)/notifications")}
                activeOpacity={0.8}
              >
                <Card style={{ marginBottom: 8, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: notif.type === "success" ? "#dcfce7"
                      : notif.type === "warning" ? "#fef3c7"
                      : "#dbeafe",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Ionicons
                      name={notif.type === "success" ? "checkmark-circle" : notif.type === "warning" ? "warning" : "information-circle"}
                      size={fs.lg}
                      color={notif.type === "success" ? "#16a34a" : notif.type === "warning" ? "#d97706" : "#2563eb"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: colors.text, fontSize: fs.sm, fontWeight: "700", flex: 1 }}>
                        {notif.title}
                      </Text>
                      {!notif.read && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error }} />
                      )}
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2 }}>
                      {notif.message}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: fs.xs, marginTop: 4 }}>
                      {notif.time}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="home" />
      <SpecialNewsModal news={specialNews} visible={newsVisible} onClose={() => setNewsVisible(false)} />
    </SafeAreaView>
  );
}
