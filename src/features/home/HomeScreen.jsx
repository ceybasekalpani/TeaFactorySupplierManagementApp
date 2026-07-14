import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import SpecialNewsModal from "../../components/SpecialNewsModal";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { QuickActionsGrid } from "./components/QuickActionsGrid";
import { RecentNotificationsList } from "./components/RecentNotificationsList";
import { StatsRow } from "./components/StatsRow";
import { WelcomeBanner } from "./components/WelcomeBanner";

export default function HomeScreen() {
  const { colors, fs, t } = useTheme();
  const {
    currentUser, activeReg,
    notifications, unreadCount,
    getTodayLeaf, getTodayLeafData, getFeatureFlags,
    specialNews, newsShown, setNewsShown, dismissNews, refreshCommunications,
  } = useApp();
  const router = useRouter();

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [newsVisible,  setNewsVisible]  = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);

  const today   = new Date();
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
  }, [newsShown, setNewsShown, specialNews.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCommunications();
    setRefreshing(false);
  };

  const totalLeaf     = getTodayLeaf();
  const todayLeafData = getTodayLeafData();
  const featureFlags  = getFeatureFlags();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
          <Text style={{ fontSize: fs.lg, fontWeight: "800", color: colors.text }}>{t.appName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(app)/notifications")}
          style={{ padding: 4, position: "relative" }}
        >
          <Ionicons name="notifications-outline" size={fs.xl} color={colors.text} />
          {unreadCount > 0 && (
            <View style={{
              position: "absolute", top: 0, right: 0,
              backgroundColor: colors.error,
              minWidth: 18, height: 18, borderRadius: 9,
              alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
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
        <WelcomeBanner colors={colors} fs={fs} t={t} currentUser={currentUser} activeReg={activeReg} dateStr={dateStr} />

        <StatsRow colors={colors} fs={fs} t={t} todayLeafData={todayLeafData} unreadCount={unreadCount} totalLeaf={totalLeaf} />

        <QuickActionsGrid colors={colors} fs={fs} t={t} featureFlags={featureFlags} />

        <RecentNotificationsList colors={colors} fs={fs} t={t} notifications={notifications} />
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
