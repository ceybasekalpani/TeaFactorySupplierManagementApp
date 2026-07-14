import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { ScreenHeader } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { LeafHistoryTab } from "./components/LeafHistoryTab";
import { MainTabBtn } from "./components/MainTabBtn";
import { RequestsSummaryTab } from "./components/RequestsSummaryTab";
import { usePdfDownload } from "./hooks/usePdfDownload";

export default function HistoryScreen() {
  // ── FIX: guard against useTheme returning t as a plain object ──────────────
  const { colors, fs, t: tRaw } = useTheme();
  const t = typeof tRaw === "function" ? tRaw : (key) => tRaw?.[key] ?? key;
  // ──────────────────────────────────────────────────────────────────────────

  const {
    getSixMonthHistory,
    getTwelveMonthHistory,
    getMonthlyRequestsSummary,
    currentUser,
    activeReg,
  } = useApp();
  const router = useRouter();

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [leafPeriod,    setLeafPeriod]    = useState("6m");
  const [mainTab,       setMainTab]       = useState("leaf");
  const [selectedMonth, setSelectedMonth] = useState(null);

  const { pdfLoading, downloadPdf } = usePdfDownload({ t, currentUser, activeReg });

  const sixHistory      = getSixMonthHistory();
  const twelveHistory   = getTwelveMonthHistory();
  const requestsSummary = getMonthlyRequestsSummary();

  const historyArray =
    leafPeriod === "6m"
      ? Array.isArray(sixHistory)    ? sixHistory    : []
      : Array.isArray(twelveHistory) ? twelveHistory : [];

  const validNets = historyArray.map((h) => h?.totalNet || 0);
  const maxNet    = Math.max(...validNets, 1);

  // ── Requests tab ────────────────────────────────────────────────────────────
  const summaryMonths    = sixHistory.map((h) => ({ key: h.key, label: h.label }));
  const activeSummaryKey = selectedMonth ?? summaryMonths[summaryMonths.length - 1]?.key;
  const monthSummary     = requestsSummary.find((s) => s.monthKey === activeSummaryKey);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t("leafAndAccountHistory")}
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      {/* ── Main tab bar ───────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection:    "row",
          marginHorizontal: 16,
          marginTop:        12,
          marginBottom:     0,
          backgroundColor:  colors.surface,
          borderRadius:     14,
          padding:          4,
        }}
      >
        <MainTabBtn id="leaf"     icon="🍃" label={t("leafHistory")}     mainTab={mainTab} setMainTab={setMainTab} colors={colors} fs={fs} />
        <MainTabBtn id="requests" icon="📋" label={t("requestSummary")} mainTab={mainTab} setMainTab={setMainTab} colors={colors} fs={fs} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {mainTab === "leaf" && (
          <LeafHistoryTab
            colors={colors} fs={fs} t={t}
            leafPeriod={leafPeriod} setLeafPeriod={setLeafPeriod}
            historyArray={historyArray} maxNet={maxNet}
            pdfLoading={pdfLoading}
            onDownloadPdf={() => downloadPdf(historyArray, leafPeriod)}
          />
        )}

        {mainTab === "requests" && (
          <RequestsSummaryTab
            colors={colors} fs={fs} t={t}
            summaryMonths={summaryMonths}
            activeSummaryKey={activeSummaryKey}
            setSelectedMonth={setSelectedMonth}
            monthSummary={monthSummary}
            requestsSummary={requestsSummary}
          />
        )}
      </ScrollView>

      <SidebarMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeKey="history"
      />
    </SafeAreaView>
  );
}
