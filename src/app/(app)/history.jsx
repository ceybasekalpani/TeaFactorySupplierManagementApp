import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, ScreenHeader } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Status colours ──────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending:    { bg: "#fef3c7", text: "#d97706" },
  approved:   { bg: "#dcfce7", text: "#16a34a" },
  paid:       { bg: "#dbeafe", text: "#2563eb" },
  dispatched: { bg: "#e0e7ff", text: "#4f46e5" },
  issued:     { bg: "#e0e7ff", text: "#4f46e5" },
  rejected:   { bg: "#fee2e2", text: "#dc2626" },
};

function StatusBadge({ status, fs, colors }) {
  const s =
    STATUS_COLOR[status?.toLowerCase()] ?? {
      bg: colors.surface,
      text: colors.textSecondary,
    };
  return (
    <View
      style={{
        backgroundColor: s.bg,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}
    >
      <Text
        style={{
          color: s.text,
          fontSize: fs.xs,
          fontWeight: "700",
          textTransform: "capitalize",
        }}
      >
        {status ?? "—"}
      </Text>
    </View>
  );
}

// ─── Helper: parse "yyyy-MM-dd" ISO string → "14 May 2026" ──────────────────
// The backend now sends requestDate as "yyyy-MM-dd".  We parse it without
// relying on the Date constructor's locale-specific behaviour by splitting
// manually, which avoids off-by-one timezone issues on mobile.
function formatFullDate(isoDate) {
  if (!isoDate) return null;
  const parts = isoDate.split("-");          // ["2026", "05", "14"]
  if (parts.length !== 3) return isoDate;   // fallback — return raw string
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) return isoDate;
  const d = new Date(year, month - 1, day); // local midnight, no timezone shift
  return d.toLocaleDateString("en-GB", {
    day:   "2-digit",
    month: "long",
    year:  "numeric",
  }); // → "14 May 2026"
}

// ─── PDF HTML builder ─────────────────────────────────────────────────────────
function buildLeafHtml({ historyArray, currentUser, activeReg, periodLabel }) {
  const totalGross    = historyArray.reduce((s, h) => s + (h?.totalGross    || 0), 0);
  const totalNet      = historyArray.reduce((s, h) => s + (h?.totalNet      || 0), 0);
  const totalSuperNet = historyArray.reduce((s, h) => s + (h?.totalSuperNet || 0), 0);
  const totalDays     = historyArray.reduce((s, h) => s + (h?.days          || 0), 0);
  const hasSuper      = historyArray.some((h) => (h?.totalSuperNet || 0) > 0);

  const rows = historyArray
    .map(
      (m) => `
        <tr>
          <td style="text-align:left; padding:10px; border:1px solid #ddd;">${m?.label ?? "-"}</td>
          <td style="text-align:right; padding:10px; border:1px solid #ddd;">${Math.round(m?.totalGross ?? 0)}</td>
          <td style="text-align:right; padding:10px; border:1px solid #ddd;">${Math.round(m?.totalNet ?? 0)}</td>
          ${hasSuper ? `<td style="text-align:right; padding:10px; border:1px solid #ddd;">${Math.round(m?.totalSuperNet ?? 0)}</td>` : ""}
          <td style="text-align:right; padding:10px; border:1px solid #ddd;">${m?.days ?? 0}</td>
        </tr>
      `
    )
    .join("");

  const superHeader = hasSuper
    ? '<th style="text-align:center; padding:12px; border:1px solid #ddd; background-color:#166534; color:white;">Super Net (kg)</th>'
    : "";
  const superTotal = hasSuper
    ? `<td style="text-align:right; padding:10px; border:1px solid #ddd; font-weight:bold;">${Math.round(totalSuperNet)}</td>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Leaf Collection Statement</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 40px 30px; color: #1a1a1a; font-size: 14px; line-height: 1.6; background: #fff;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          .header-band {
            background: linear-gradient(135deg, #166534 0%, #14532d 100%);
            color: #fff; padding: 24px 28px; border-radius: 12px; margin-bottom: 24px;
          }
          .header-band h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.3px; }
          .header-band p  { font-size: 13px; opacity: 0.9; margin-top: 4px; }
          .info-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 12px 30px;
            margin-bottom: 24px; padding: 18px 20px; background: #f0fdf4;
            border-radius: 10px; border: 1px solid #bbf7d0;
          }
          .info-item  { display: flex; flex-direction: column; }
          .info-label { color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .info-value { font-weight: 700; font-size: 14px; color: #111827; }
          .stats-row  { display: flex; gap: 15px; margin-bottom: 28px; flex-wrap: wrap; }
          .stat-box   { flex: 1; min-width: 120px; padding: 16px; border-radius: 10px; text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; }
          .stat-value { font-size: 28px; font-weight: 800; color: #166534; margin-bottom: 5px; }
          .stat-label { font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
          .table-wrapper { overflow-x: auto; margin: 20px 0 16px; border-radius: 10px; border: 1px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th  { background: #166534; color: white; padding: 12px 10px; text-align: center; font-weight: 600; font-size: 13px; border: 1px solid #1f6e43; }
          td  { padding: 10px; border: 1px solid #e5e7eb; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .total-row    { background-color: #dcfce7 !important; font-weight: 800; }
          .total-row td { font-weight: 800; color: #166534; border-top: 2px solid #166534; }
          .footer { margin-top: 30px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          @media print { body { padding: 20px; } .stat-box { break-inside: avoid; } .table-wrapper { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-band">
            <h1>🍃 Leaf Collection Statement</h1>
            <p>${periodLabel}</p>
          </div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Supplier Name</div><div class="info-value">${currentUser?.name ?? "-"}</div></div>
            <div class="info-item"><div class="info-label">Registration No.</div><div class="info-value">${activeReg?.regNo ?? "-"}</div></div>
            <div class="info-item"><div class="info-label">Reporting Period</div><div class="info-value">${periodLabel}</div></div>
            <div class="info-item"><div class="info-label">Generated On</div><div class="info-value">${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div></div>
          </div>
          <div class="stats-row">
            <div class="stat-box"><div class="stat-value">${Math.round(totalGross).toLocaleString()}</div><div class="stat-label">Total Gross (kg)</div></div>
            <div class="stat-box"><div class="stat-value">${Math.round(totalNet).toLocaleString()}</div><div class="stat-label">Normal Net (kg)</div></div>
            ${hasSuper ? `<div class="stat-box"><div class="stat-value">${Math.round(totalSuperNet).toLocaleString()}</div><div class="stat-label">Super Net (kg)</div></div>` : ""}
            <div class="stat-box"><div class="stat-value">${totalDays}</div><div class="stat-label">Collection Days</div></div>
          </div>
          <div class="table-wrapper">
            <table cellspacing="0">
              <thead>
                <tr>
                  <th style="text-align:left">Month</th>
                  <th>Gross (kg)</th>
                  <th>Normal Net (kg)</th>
                  ${superHeader}
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                <tr class="total-row">
                  <td style="text-align:left; font-weight:800;">TOTAL</td>
                  <td style="text-align:right; font-weight:800;">${Math.round(totalGross).toLocaleString()}</td>
                  <td style="text-align:right; font-weight:800;">${Math.round(totalNet).toLocaleString()}</td>
                  ${superTotal}
                  <td style="text-align:right; font-weight:800;">${totalDays}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>This statement was automatically generated by the Tea Factory Supplier Management System.</p>
            <p>For queries, please contact the factory office.</p>
          </div>
        </div>
      </body>
    </html>`;
}

// ─── Creative Period Selector (animated sliding pill) ────────────────────────
function PeriodSelector({ leafPeriod, setLeafPeriod, colors, fs }) {
  const slideAnim = useRef(new Animated.Value(leafPeriod === "6m" ? 0 : 1)).current;

  const handleSelect = (val) => {
    Animated.spring(slideAnim, {
      toValue:      val === "6m" ? 0 : 1,
      useNativeDriver: false,
      speed:        20,
      bounciness:   6,
    }).start();
    setLeafPeriod(val);
  };

  const TRACK_H = 52;
  const PILL_W  = (SCREEN_W - 32 - 8) / 2; // (screen - outer padding - inner padding/2)

  const pillLeft = slideAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [4, PILL_W + 4],
  });

  const options = [
    { value: "6m",  label: "6 Months",  icon: "📆", sub: "Half year" },
    { value: "12m", label: "12 Months", icon: "🗓️", sub: "Full year"  },
  ];

  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize:        fs.xs,
          fontWeight:      "600",
          color:           colors.textSecondary,
          letterSpacing:   1,
          textTransform:   "uppercase",
          marginBottom:    10,
        }}
      >
        Reporting Period
      </Text>

      {/* Track */}
      <View
        style={{
          height:          TRACK_H,
          borderRadius:    16,
          backgroundColor: colors.surface,
          borderWidth:     1.5,
          borderColor:     colors.border,
          flexDirection:   "row",
          alignItems:      "center",
          position:        "relative",
          overflow:        "hidden",
        }}
      >
        {/* Animated sliding pill */}
        <Animated.View
          style={{
            position:        "absolute",
            left:            pillLeft,
            top:             4,
            bottom:          4,
            width:           PILL_W - 8,
            borderRadius:    12,
            backgroundColor: colors.primary,
            shadowColor:     colors.primary,
            shadowOffset:    { width: 0, height: 4 },
            shadowOpacity:   0.35,
            shadowRadius:    8,
            elevation:       6,
          }}
        />

        {/* Option buttons (rendered above the pill via zIndex) */}
        {options.map((o) => {
          const active = leafPeriod === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => handleSelect(o.value)}
              activeOpacity={0.8}
              style={{
                flex:            1,
                height:          TRACK_H,
                flexDirection:   "row",
                alignItems:      "center",
                justifyContent:  "center",
                gap:             8,
                zIndex:          1,
              }}
            >
              <Text style={{ fontSize: 16 }}>{o.icon}</Text>
              <View>
                <Text
                  style={{
                    fontSize:   fs.sm,
                    fontWeight: "700",
                    color:      active ? "#fff" : colors.text,
                    lineHeight: 18,
                  }}
                >
                  {o.label}
                </Text>
                <Text
                  style={{
                    fontSize:   10,
                    color:      active ? "rgba(255,255,255,0.72)" : colors.textMuted,
                    lineHeight: 13,
                  }}
                >
                  {o.sub}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tick marks — fill to show selection depth */}
      <View
        style={{
          flexDirection:   "row",
          justifyContent:  "space-around",
          marginTop:       6,
        }}
      >
        {[...Array(13)].map((_, i) => {
          const isAnchor = i === 0 || i === 6 || i === 12;
          const filled   =
            (leafPeriod === "6m"  && i <= 6) ||
            (leafPeriod === "12m" && i <= 12);
          return (
            <View
              key={i}
              style={{
                width:           isAnchor ? 2 : 1,
                height:          isAnchor ? 6 : 4,
                borderRadius:    1,
                backgroundColor: filled ? colors.primary + "90" : colors.border,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { colors, fs, t } = useTheme();
  const {
    getSixMonthHistory,
    getTwelveMonthHistory,
    getMonthlyRequestsSummary,
    currentUser,
    activeReg,
  } = useApp();
  const router = useRouter();

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [leafPeriod,    setLeafPeriod]    = useState("6m"); // "6m" | "12m"
  const [mainTab,       setMainTab]       = useState("leaf"); // "leaf" | "requests"
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [pdfLoading,    setPdfLoading]    = useState(false);

  const sixHistory      = getSixMonthHistory();
  const twelveHistory   = getTwelveMonthHistory();
  const requestsSummary = getMonthlyRequestsSummary();

  const historyArray =
    leafPeriod === "6m"
      ? Array.isArray(sixHistory)    ? sixHistory    : []
      : Array.isArray(twelveHistory) ? twelveHistory : [];

  const validNets = historyArray.map((h) => h?.totalNet || 0);
  const maxNet    = Math.max(...validNets, 1);

  // ── PDF ─────────────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      if (!historyArray.length) {
        Alert.alert("No Data", "No history available to generate PDF.");
        return;
      }
      const periodLabel =
        leafPeriod === "6m"
          ? "6 Month Leaf Collection Statement"
          : "12 Month (Annual) Leaf Collection Statement";

      const html    = buildLeafHtml({ historyArray, currentUser, activeReg, periodLabel });
      const { uri } = await Print.printToFileAsync({ html });
      const suffix  = leafPeriod === "6m" ? "6M" : "12M";
      const dest    =
        FileSystem.documentDirectory +
        `LeafStatement_${activeReg?.regNo || "supplier"}_${suffix}_${Date.now()}.pdf`;

      await FileSystem.moveAsync({ from: uri, to: dest });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(dest);
      else          Alert.alert("PDF Saved", `Saved to:\n${dest}`);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Requests tab ────────────────────────────────────────────────────────────
  const summaryMonths    = sixHistory.map((h) => ({ key: h.key, label: h.label }));
  const activeSummaryKey = selectedMonth ?? summaryMonths[summaryMonths.length - 1]?.key;
  const monthSummary     = requestsSummary.find((s) => s.monthKey === activeSummaryKey);

  // ── Shared UI helpers ────────────────────────────────────────────────────────
  const MainTabBtn = ({ id, icon, label }) => {
    const active = mainTab === id;
    return (
      <TouchableOpacity
        onPress={() => setMainTab(id)}
        activeOpacity={0.8}
        style={{
          flex:            1,
          flexDirection:   "row",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             6,
          paddingVertical: 10,
          borderRadius:    10,
          backgroundColor: active ? colors.primary : "transparent",
        }}
      >
        <Text style={{ fontSize: 14 }}>{icon}</Text>
        <Text
          style={{
            fontSize:   fs.sm,
            fontWeight: "700",
            color:      active ? "#fff" : colors.textSecondary,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // ── Bar chart ────────────────────────────────────────────────────────────────
  const BarChart = () => {
    if (!historyArray.length)
      return (
        <View style={{ alignItems: "center", padding: 24 }}>
          <Text style={{ color: colors.textSecondary }}>No data available</Text>
        </View>
      );

    return (
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 180, gap: 8 }}>
        {historyArray.map((month, index) => {
          const totalNet   = month?.totalNet ?? 0;
          const barHeight  = maxNet > 0 ? (totalNet / maxNet) * 135 : 0;
          const monthLabel = month?.label || `Month ${index + 1}`;
          const shortMonth = monthLabel.split(" ")[0];
          return (
            <View key={month?.key || index} style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color:        colors.primary,
                  fontSize:     fs.xs,
                  fontWeight:   "700",
                  marginBottom: 5,
                }}
              >
                {totalNet > 0 ? Math.round(totalNet) : ""}
              </Text>
              <View
                style={{
                  width:           "100%",
                  height:          Math.max(barHeight, 4),
                  backgroundColor: colors.primary,
                  borderRadius:    8,
                  opacity:         totalNet > 0 ? 1 : 0.25,
                }}
              />
              <Text
                style={{
                  color:       colors.textMuted,
                  fontSize:    9,
                  marginTop:   6,
                  textAlign:   "center",
                  fontWeight:  "500",
                }}
              >
                {shortMonth}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Leaf & Request History"
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      {/* ── Main tab bar ───────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection:   "row",
          marginHorizontal: 16,
          marginTop:       12,
          marginBottom:    0,
          backgroundColor: colors.surface,
          borderRadius:    14,
          padding:         4,
        }}
      >
        <MainTabBtn id="leaf"     icon="🍃" label="Leaf History"    />
        <MainTabBtn id="requests" icon="📋" label="Request Summary" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {/* ═══════════════ LEAF HISTORY TAB ═══════════════ */}
        {mainTab === "leaf" && (
          <>
            {/* Creative animated period selector */}
            <PeriodSelector
              leafPeriod={leafPeriod}
              setLeafPeriod={setLeafPeriod}
              colors={colors}
              fs={fs}
            />

            {/* Summary KPI cards */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              {[
                {
                  label: leafPeriod === "6m" ? "Total Net (6 mo)" : "Total Net (12 mo)",
                  value: Math.round(
                    historyArray.reduce((s, h) => s + (h?.totalNet || 0), 0)
                  ),
                  color: colors.primary,
                  icon:  "🍃",
                },
                {
                  label: "Collection Days",
                  value: historyArray.reduce((s, h) => s + (h?.days || 0), 0),
                  color: colors.accent,
                  icon:  "📅",
                },
              ].map((kpi, i) => (
                <View
                  key={i}
                  style={{
                    flex:            1,
                    backgroundColor: colors.card,
                    borderRadius:    16,
                    padding:         16,
                    borderWidth:     1,
                    borderColor:     colors.cardBorder,
                    alignItems:      "center",
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 6 }}>{kpi.icon}</Text>
                  <Text
                    style={{
                      color:      kpi.color,
                      fontSize:   fs.xl,
                      fontWeight: "800",
                    }}
                  >
                    {kpi.value.toLocaleString()}
                  </Text>
                  <Text
                    style={{
                      color:      colors.textSecondary,
                      fontSize:   fs.xs,
                      textAlign:  "center",
                      marginTop:  4,
                    }}
                  >
                    {kpi.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Bar chart card */}
            <Text
              style={{
                fontSize:      fs.sm,
                fontWeight:    "700",
                color:         colors.textSecondary,
                marginBottom:  10,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Monthly Net Leaf Collection (kg)
            </Text>
            <Card style={{ marginBottom: 20, paddingVertical: 16, paddingHorizontal: 8 }}>
              <BarChart />
            </Card>

            {/* Table */}
            <Text
              style={{
                fontSize:      fs.sm,
                fontWeight:    "700",
                color:         colors.textSecondary,
                marginBottom:  10,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {leafPeriod === "6m" ? "6 Month Summary" : "12 Month Summary"}
            </Text>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius:    16,
                borderWidth:     1,
                borderColor:     colors.cardBorder,
                overflow:        "hidden",
                marginBottom:    20,
              }}
            >
              {/* Table header */}
              <View
                style={{
                  flexDirection:   "row",
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                }}
              >
                {["MONTH", "GROSS", "NET", "DAYS"].map((h, i) => (
                  <Text
                    key={h}
                    style={{
                      flex:       i === 0 ? 2 : 1,
                      color:      "#fff",
                      fontSize:   fs.xs,
                      fontWeight: "700",
                      textAlign:  i === 0 ? "left" : "right",
                    }}
                  >
                    {h}
                  </Text>
                ))}
              </View>

              {historyArray.length > 0 ? (
                <>
                  {historyArray.map((m, i) => (
                    <View
                      key={m?.key || i}
                      style={{
                        flexDirection:    "row",
                        alignItems:       "center",
                        paddingVertical:  14,
                        paddingHorizontal: 16,
                        borderBottomWidth: i < historyArray.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                        backgroundColor:
                          i % 2 === 1 ? colors.surface + "60" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          flex:       2,
                          color:      colors.text,
                          fontSize:   fs.sm,
                          fontWeight: "600",
                        }}
                      >
                        {m?.label ?? "-"}
                      </Text>
                      <Text
                        style={{
                          flex:      1,
                          color:     colors.textSecondary,
                          fontSize:  fs.sm,
                          textAlign: "right",
                        }}
                      >
                        {Math.round(m?.totalGross ?? 0).toLocaleString()}
                      </Text>
                      <Text
                        style={{
                          flex:       1,
                          color:      colors.primary,
                          fontSize:   fs.sm,
                          fontWeight: "700",
                          textAlign:  "right",
                        }}
                      >
                        {Math.round(m?.totalNet ?? 0).toLocaleString()}
                      </Text>
                      <Text
                        style={{
                          flex:      1,
                          color:     colors.textSecondary,
                          fontSize:  fs.sm,
                          textAlign: "right",
                        }}
                      >
                        {m?.days ?? 0}
                      </Text>
                    </View>
                  ))}

                  {/* Totals row */}
                  <View
                    style={{
                      flexDirection:     "row",
                      paddingVertical:   14,
                      paddingHorizontal: 16,
                      backgroundColor:   colors.primary + "15",
                      borderTopWidth:    2,
                      borderTopColor:    colors.primary,
                    }}
                  >
                    <Text style={{ flex: 2, color: colors.primary, fontSize: fs.sm, fontWeight: "800" }}>
                      TOTAL
                    </Text>
                    <Text style={{ flex: 1, color: colors.primary, fontSize: fs.sm, fontWeight: "800", textAlign: "right" }}>
                      {Math.round(historyArray.reduce((s, m) => s + (m?.totalGross ?? 0), 0)).toLocaleString()}
                    </Text>
                    <Text style={{ flex: 1, color: colors.primary, fontSize: fs.sm, fontWeight: "800", textAlign: "right" }}>
                      {Math.round(historyArray.reduce((s, m) => s + (m?.totalNet ?? 0), 0)).toLocaleString()}
                    </Text>
                    <Text style={{ flex: 1, color: colors.primary, fontSize: fs.sm, fontWeight: "800", textAlign: "right" }}>
                      {historyArray.reduce((s, m) => s + (m?.days ?? 0), 0)}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={{ padding: 32, alignItems: "center" }}>
                  <Text style={{ color: colors.textSecondary, fontSize: fs.sm }}>
                    No data available for the selected period
                  </Text>
                </View>
              )}
            </View>

            {/* PDF download */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius:    16,
                padding:         18,
                borderWidth:     1,
                borderColor:     colors.cardBorder,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems:    "center",
                  gap:           14,
                  marginBottom:  16,
                }}
              >
                <View
                  style={{
                    width:           48,
                    height:          48,
                    borderRadius:    14,
                    backgroundColor: colors.primary + "15",
                    alignItems:      "center",
                    justifyContent:  "center",
                  }}
                >
                  <Ionicons name="document-text" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: fs.md, fontWeight: "700" }}>
                    {leafPeriod === "6m"
                      ? "6 Month Leaf Statement"
                      : "Annual (12 Month) Statement"}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2 }}>
                    {leafPeriod === "6m"
                      ? "Download complete 6-month leaf collection report as PDF"
                      : "Download full annual leaf collection statement as PDF"}
                  </Text>
                </View>
              </View>
              <Button
                title={
                  leafPeriod === "6m"
                    ? "Download 6 Month Statement"
                    : "Download Annual Statement"
                }
                onPress={handleDownloadPDF}
                loading={pdfLoading}
                icon="download"
              />
            </View>
          </>
        )}

        {/* ═══════════════ REQUEST SUMMARY TAB ═══════════════ */}
        {mainTab === "requests" && (
          <>
            <Text
              style={{
                fontSize:      fs.sm,
                fontWeight:    "700",
                color:         colors.textSecondary,
                marginBottom:  12,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Select Month
            </Text>

            {/* Month pill picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              <View style={{ flexDirection: "row", gap: 10 }}>
                {summaryMonths.map((m) => {
                  const active = m.key === activeSummaryKey;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setSelectedMonth(m.key)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 18,
                        paddingVertical:   10,
                        borderRadius:      25,
                        backgroundColor:   active ? colors.primary : colors.surface,
                        borderWidth:       1.5,
                        borderColor:       active ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color:      active ? "#fff" : colors.textSecondary,
                          fontSize:   fs.sm,
                          fontWeight: "600",
                        }}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {monthSummary ? (
              <>
                {/* ── Cash Requests ── */}
                <SummarySection
                  icon="💵"
                  title="Cash Requests"
                  accentColor="#16a34a"
                  count={monthSummary.cash?.count ?? 0}
                  colors={colors}
                  fs={fs}
                >
                  {(monthSummary.cash?.count ?? 0) > 0 ? (
                    <>
                      <StatRow label="Total Amount" value={`Rs. ${(monthSummary.cash?.totalAmount ?? 0).toLocaleString()}`} colors={colors} fs={fs} />
                      <StatRow label="Pending"      value={monthSummary.cash?.pendingCount  ?? 0} colors={colors} fs={fs} />
                      <StatRow label="Approved"     value={monthSummary.cash?.approvedCount ?? 0} colors={colors} fs={fs} />
                      <StatRow label="Paid"         value={monthSummary.cash?.paidCount     ?? 0} colors={colors} fs={fs} />
                      {(monthSummary.cash?.requests ?? []).map((r, i) => (
                        <RequestRow
                          key={i}
                          left={`Rs. ${Number(r.amount ?? 0).toLocaleString()}`}
                          requestDate={r.requestDate}
                          status={r.status}
                          colors={colors}
                          fs={fs}
                        />
                      ))}
                    </>
                  ) : (
                    <EmptyNote text="No cash requests this month." colors={colors} fs={fs} />
                  )}
                </SummarySection>

                {/* ── Fertilizer Requests ── */}
                <SummarySection
                  icon="🌿"
                  title="Fertilizer Requests"
                  accentColor="#0891b2"
                  count={monthSummary.fertilizer?.count ?? 0}
                  colors={colors}
                  fs={fs}
                >
                  {(monthSummary.fertilizer?.count ?? 0) > 0 ? (
                    <>
                      <StatRow label="Total Qty"  value={`${monthSummary.fertilizer?.totalQuantity ?? 0} units`} colors={colors} fs={fs} />
                      <StatRow label="Pending"    value={monthSummary.fertilizer?.pendingCount    ?? 0} colors={colors} fs={fs} />
                      <StatRow label="Approved"   value={monthSummary.fertilizer?.approvedCount   ?? 0} colors={colors} fs={fs} />
                      <StatRow label="Dispatched" value={monthSummary.fertilizer?.dispatchedCount ?? 0} colors={colors} fs={fs} />
                      {(monthSummary.fertilizer?.requests ?? []).map((r, i) => (
                        <RequestRow
                          key={i}
                          left={`${r.fertilizerType} — ${r.quantity} ${r.unit}`}
                          requestDate={r.requestDate}
                          status={r.status}
                          colors={colors}
                          fs={fs}
                        />
                      ))}
                    </>
                  ) : (
                    <EmptyNote text="No fertilizer requests this month." colors={colors} fs={fs} />
                  )}
                </SummarySection>

                {/* ── Item Requests ── */}
                <SummarySection
                  icon="📦"
                  title="Item Requests"
                  accentColor="#7c3aed"
                  count={monthSummary.item?.count ?? 0}
                  colors={colors}
                  fs={fs}
                >
                  {(monthSummary.item?.count ?? 0) > 0 ? (
                    <>
                      <StatRow label="Total Qty" value={`${monthSummary.item?.totalQuantity ?? 0} units`} colors={colors} fs={fs} />
                      <StatRow label="Pending"   value={monthSummary.item?.pendingCount    ?? 0} colors={colors} fs={fs} />
                      <StatRow label="Approved"  value={monthSummary.item?.approvedCount   ?? 0} colors={colors} fs={fs} />
                      <StatRow label="Issued"    value={monthSummary.item?.issuedCount     ?? 0} colors={colors} fs={fs} />
                      {(monthSummary.item?.requests ?? []).map((r, i) => (
                        <RequestRow
                          key={i}
                          left={`${r.itemType} — ${r.quantity} ${r.unit}`}
                          requestDate={r.requestDate}
                          status={r.status}
                          colors={colors}
                          fs={fs}
                        />
                      ))}
                    </>
                  ) : (
                    <EmptyNote text="No item requests this month." colors={colors} fs={fs} />
                  )}
                </SummarySection>
              </>
            ) : (
              <Card>
                <Text
                  style={{
                    color:          colors.textSecondary,
                    textAlign:      "center",
                    paddingVertical: 16,
                    fontSize:       fs.sm,
                  }}
                >
                  {requestsSummary.length === 0
                    ? "Loading summary data…"
                    : "No request data found for the selected month."}
                </Text>
              </Card>
            )}
          </>
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummarySection({ icon, title, accentColor, count, colors, fs, children }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius:    16,
        borderWidth:     1,
        borderColor:     colors.cardBorder,
        marginBottom:    16,
        overflow:        "hidden",
      }}
    >
      <View
        style={{
          flexDirection:   "row",
          alignItems:      "center",
          gap:             12,
          backgroundColor: accentColor + "12",
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: accentColor + "25",
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <Text
          style={{
            flex:       1,
            fontSize:   fs.sm,
            fontWeight: "700",
            color:      accentColor,
          }}
        >
          {title}
        </Text>
        <View
          style={{
            backgroundColor:  accentColor,
            borderRadius:     14,
            minWidth:         28,
            height:           28,
            alignItems:       "center",
            justifyContent:   "center",
            paddingHorizontal: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: fs.xs, fontWeight: "800" }}>
            {count}
          </Text>
        </View>
      </View>
      <View style={{ padding: 16 }}>{children}</View>
    </View>
  );
}

function StatRow({ label, value, colors, fs }) {
  return (
    <View
      style={{
        flexDirection:  "row",
        justifyContent: "space-between",
        marginBottom:   6,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: fs.xs }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: fs.xs, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

// ── RequestRow ────────────────────────────────────────────────────────────────
// requestDate: ISO string "yyyy-MM-dd" from the backend → formatted to
// "14 May 2026" by formatFullDate() above.
function RequestRow({ left, requestDate, status, colors, fs }) {
  const dateLabel = formatFullDate(requestDate);

  return (
    <View
      style={{
        marginTop:    8,
        paddingTop:   8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      {/* Row 1: description + status badge */}
      <View
        style={{
          flexDirection:  "row",
          justifyContent: "space-between",
          alignItems:     "center",
        }}
      >
        <Text
          style={{
            color:      colors.text,
            fontSize:   fs.xs,
            fontWeight: "600",
            flex:       1,
            marginRight: 10,
          }}
          numberOfLines={1}
        >
          {left}
        </Text>
        <StatusBadge status={status} fs={fs} colors={colors} />
      </View>

      {/* Row 2: full requested date */}
      {dateLabel != null && (
        <View
          style={{
            flexDirection: "row",
            alignItems:    "center",
            marginTop:     4,
            gap:           4,
          }}
        >
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "500" }}>
            Requested: {dateLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

function EmptyNote({ text, colors, fs }) {
  return (
    <Text style={{ color: colors.textSecondary, fontSize: fs.xs, fontStyle: "italic" }}>
      {text}
    </Text>
  );
}