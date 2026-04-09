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

const iconMap = {
  success: { name: "checkmark-circle",  color: "#16a34a", bg: "#dcfce7" },
  warning: { name: "warning",           color: "#d97706", bg: "#fef3c7" },
  error:   { name: "close-circle",      color: "#dc2626", bg: "#fee2e2" },
  info:    { name: "information-circle",color: "#2563eb", bg: "#dbeafe" },
};

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t.goodMorning;
  if (h < 17) return t.goodAfternoon;
  return t.goodEvening;
}

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

export default function HomeScreen() {
  const { colors, fs, t } = useTheme();
  const { currentUser, activeReg, notifications, unreadCount, getTodayLeaf, getTodayLeafData, getFeatureFlags, specialNews, newsShown, setNewsShown, dismissNews } = useApp();
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
  const todayLeafData = getTodayLeafData();
  const featureFlags = getFeatureFlags();
  const recentNotifications = notifications.slice(0, 3);

  const quickActions = [
    { label: t.cashRequest,       icon: "cash-outline",       route: "/(app)/cash-request",       color: "#22c55e", enabled: featureFlags.cash },
    { label: t.fertilizerRequest, icon: "leaf-outline",       route: "/(app)/fertilizer-request", color: "#0891b2", enabled: featureFlags.fertilizer },
    { label: t.itemRequest,       icon: "cube-outline",       route: "/(app)/item-request",       color: "#d97706", enabled: featureFlags.item },
    { label: t.leafCard,          icon: "card-outline",       route: "/(app)/leaf-details",       color: "#7c3aed", enabled: true },
    { label: t.history,           icon: "bar-chart-outline",  route: "/(app)/history",            color: "#e11d48", enabled: true },
    { label: t.settings,          icon: "settings-outline",   route: "/(app)/settings",           color: "#64748b", enabled: true },
  ];

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
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: colors.primary + "20",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 18 }}>🍃</Text>
          </View>
          <Text style={{ fontSize: fs.lg, fontWeight: "800", color: colors.text }}>Tea Factory</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(app)/notifications")}
          style={{ padding: 4, position: "relative" }}
        >
          <Ionicons name="notifications-outline" size={fs.xl} color={colors.text} />
          {unreadCount > 0 && (
            <View style={{
              position: "absolute",
              top: 0,
              right: 0,
              backgroundColor: colors.error,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 3,
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
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Welcome Banner */}
        <View style={{
          margin: 16,
          borderRadius: 22,
          overflow: "hidden",
          backgroundColor: colors.primary,
        }}>
          {/* Decorative circles */}
          <View style={{ position: "absolute", right: -30, top: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.08)" }} />
          <View style={{ position: "absolute", right: 30, bottom: -40, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)" }} />
          <View style={{ position: "absolute", left: -20, bottom: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)" }} />

          <View style={{ padding: 20 }}>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: fs.sm }}>
              {getGreeting(t)},
            </Text>
            <Text style={{ color: "#fff", fontSize: fs["2xl"], fontWeight: "800", marginTop: 2 }}>
              {currentUser?.name} 👋
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <View style={{
                backgroundColor: "rgba(255,255,255,0.18)",
                paddingHorizontal: 10, paddingVertical: 5,
                borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 4,
              }}>
                <Ionicons name="card-outline" size={fs.xs} color="#fff" />
                <Text style={{ color: "#fff", fontSize: fs.xs, fontWeight: "600" }}>
                  {currentUser?.id}
                </Text>
              </View>
              {activeReg?.route && (
                <View style={{
                  backgroundColor: "rgba(255,255,255,0.18)",
                  paddingHorizontal: 10, paddingVertical: 5,
                  borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 4,
                }}>
                  <Ionicons name="map-outline" size={fs.xs} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: fs.xs, fontWeight: "600" }}>
                    {activeReg.route.split(" - ")[0]}
                  </Text>
                </View>
              )}
            </View>

            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: fs.xs, marginTop: 10 }}>
              {dateStr}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        {todayLeafData.hasSuper ? (
          /* Super leaf enabled — 3 equal cards in one row */
          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16, alignItems: "stretch" }}>
            {[
              { label: "Normal", value: todayLeafData.normalNet, sub: "kg · today", bg: "#dcfce7", route: "/(app)/leaf-details", content: <Text style={{ fontSize: 18 }}>🍃</Text> },
              { label: "Super",  value: todayLeafData.superNet,  sub: "kg · today", bg: "#fef9c3", route: "/(app)/leaf-details", content: <Text style={{ fontSize: 18 }}>⭐</Text> },
              { label: "Alerts", value: unreadCount,             sub: "unread",     bg: "#dbeafe", route: "/(app)/notifications", content: <Ionicons name="notifications" size={18} color="#2563eb" /> },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={{ flex: 1 }} onPress={() => router.push(item.route)} activeOpacity={0.8}>
                <View style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 4,
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
        ) : (
          /* No super — two equal cards side by side */
          <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 16 }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push("/(app)/leaf-details")} activeOpacity={0.8}>
              <Card style={{ alignItems: "center", paddingVertical: 16 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 22 }}>🍃</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: fs.xs, textAlign: "center" }}>{t.totalLeaf}</Text>
                <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "800", marginTop: 2 }}>{totalLeaf}</Text>
                <Text style={{ color: colors.textMuted, fontSize: fs.xs }}>kg · this month</Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push("/(app)/notifications")} activeOpacity={0.8}>
              <Card style={{ alignItems: "center", paddingVertical: 16 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <Ionicons name="notifications" size={22} color="#2563eb" />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: fs.xs, textAlign: "center" }}>Notifications</Text>
                <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "800", marginTop: 2 }}>{unreadCount}</Text>
                <Text style={{ color: colors.textMuted, fontSize: fs.xs }}>unread</Text>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Registration */}
        {activeReg && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Card style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              backgroundColor: colors.primary + "10",
              borderWidth: 1, borderColor: colors.primary + "30",
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: colors.primary + "25",
                alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons name="document-text" size={fs.lg} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: fs.sm }}>
                  Active Registration
                </Text>
                <Text style={{ color: colors.text, fontSize: fs.base, fontWeight: "600", marginTop: 1 }}>
                  {activeReg.regNo}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 1 }}>
                  {activeReg.route}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={fs.xl} color={colors.primary} />
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            Quick Actions
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

        {/* Recent Notifications */}
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
              const ic = iconMap[notif.type] || iconMap.info;
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
                        {timeAgo(notif.createdAt)}
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="home" />
      <SpecialNewsModal
        news={specialNews}
        visible={newsVisible}
        onClose={(id) => {
          setNewsVisible(false);
          if (id) dismissNews(id);
        }}
      />
    </SafeAreaView>
  );
}
