import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Card, EmptyState, Picker, ScreenHeader, ToggleTabs } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const MONTH_OPTIONS = [
  { value: "2026-02", label: "Feb 2026" },
  { value: "2026-01", label: "Jan 2026" },
  { value: "2025-12", label: "Dec 2025" },
  { value: "2025-11", label: "Nov 2025" },
  { value: "2025-10", label: "Oct 2025" },
  { value: "2025-09", label: "Sep 2025" },
];

function getDaysInMonth(yearMonth) {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export default function LeafDetailsScreen() {
  const { colors, fs, t } = useTheme();
  const { getLeafData } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("monthly");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("2026-01");

  const leafData = getLeafData(selectedMonth);

  const tabs = [
    { key: "monthly", label: t.monthLeafDetails },
    { key: "card", label: t.leafCard },
  ];

  // Summary stats
  const totalGross = leafData.reduce((s, d) => s + d.gross, 0);
  const totalNet = leafData.reduce((s, d) => s + d.netWeight, 0);
  const totalWater = leafData.reduce((s, d) => s + d.water, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={activeTab === "monthly" ? t.monthLeafDetails : t.leafCard}
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <View style={{ padding: 16, paddingBottom: 0 }}>
        <ToggleTabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
        <Picker
          label={t.selectMonthView}
          value={selectedMonth}
          options={MONTH_OPTIONS}
          onSelect={setSelectedMonth}
          placeholder="Select Month"
        />
      </View>

      {/* Summary row */}
      {leafData.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
          {[
            { label: "Total Gross", value: `${totalGross} kg`, color: "#16a34a" },
            { label: "Total Water", value: `${totalWater} kg`, color: "#0891b2" },
            { label: "Total Net", value: `${totalNet} kg`, color: "#7c3aed" },
          ].map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 10,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: stat.color, fontSize: fs.md, fontWeight: "800" }}>{stat.value}</Text>
              <Text style={{ color: colors.textMuted, fontSize: fs.xs, marginTop: 2, textAlign: "center" }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        horizontal={false}
      >
        {activeTab === "monthly" ? (
          <MonthlyLeafTable leafData={leafData} colors={colors} fs={fs} t={t} />
        ) : (
          <LeafCardTable leafData={leafData} selectedMonth={selectedMonth} colors={colors} fs={fs} t={t} />
        )}
      </ScrollView>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="monthLeafDetails" />
    </SafeAreaView>
  );
}

// ── Monthly Leaf Details Table (only days with data) ───────────────────────────
function MonthlyLeafTable({ leafData, colors, fs, t }) {
  if (leafData.length === 0) {
    return <Card><EmptyState icon="leaf-outline" message="No leaf data for this month" /></Card>;
  }

  const cols = [t.day, t.gross, t.bags, t.water, t.netWeight];

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 10,
      }}>
        {cols.map((col, i) => (
          <Text
            key={col}
            style={{
              flex: i === 0 ? 0.8 : 1,
              color: "#fff",
              fontSize: fs.xs,
              fontWeight: "700",
              textAlign: i === 0 ? "left" : "right",
            }}
          >
            {col}
          </Text>
        ))}
      </View>

      {leafData.map((row, i) => (
        <View
          key={row.day}
          style={{
            flexDirection: "row",
            paddingVertical: 10,
            paddingHorizontal: 10,
            borderBottomWidth: i < leafData.length - 1 ? 1 : 0,
            borderBottomColor: colors.border,
            backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "50",
          }}
        >
          <Text style={{ flex: 0.8, color: colors.primary, fontSize: fs.xs, fontWeight: "700" }}>
            {String(row.day).padStart(2, "0")}
          </Text>
          <Text style={{ flex: 1, color: colors.text, fontSize: fs.xs, textAlign: "right" }}>{row.gross}</Text>
          <Text style={{ flex: 1, color: colors.text, fontSize: fs.xs, textAlign: "right" }}>{row.bags}</Text>
          <Text style={{ flex: 1, color: colors.info || "#0891b2", fontSize: fs.xs, textAlign: "right" }}>{row.water}</Text>
          <Text style={{ flex: 1, color: colors.success || "#16a34a", fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>
            {row.netWeight}
          </Text>
        </View>
      ))}

      {/* Totals */}
      <View style={{
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: colors.surface,
        borderTopWidth: 2,
        borderTopColor: colors.primary,
      }}>
        <Text style={{ flex: 0.8, color: colors.primary, fontSize: fs.xs, fontWeight: "700" }}>TOT</Text>
        <Text style={{ flex: 1, color: colors.text, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>
          {leafData.reduce((s, d) => s + d.gross, 0)}
        </Text>
        <Text style={{ flex: 1, color: colors.text, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>
          {leafData.reduce((s, d) => s + d.bags, 0)}
        </Text>
        <Text style={{ flex: 1, color: colors.text, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>
          {leafData.reduce((s, d) => s + d.water, 0)}
        </Text>
        <Text style={{ flex: 1, color: colors.primary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>
          {leafData.reduce((s, d) => s + d.netWeight, 0)}
        </Text>
      </View>
    </Card>
  );
}

// ── Leaf Card Table (every day of month, Normal/Super) ─────────────────────────
function LeafCardTable({ leafData, selectedMonth, colors, fs, t }) {
  const totalDays = getDaysInMonth(selectedMonth);
  const dataMap = {};
  leafData.forEach((d) => { dataMap[d.day] = d; });

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const totalNormal = leafData.reduce((s, d) => s + (d.netWeight || 0), 0);

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 14 }}>
        <Text style={{ flex: 0.8, color: "#fff", fontSize: fs.xs, fontWeight: "700" }}>{t.day}</Text>
        <Text style={{ flex: 1, color: "#fff", fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>{t.normal}</Text>
        <Text style={{ flex: 1, color: "#fff", fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>{t.super}</Text>
      </View>

      {days.map((day, i) => {
        const row = dataMap[day];
        return (
          <View
            key={day}
            style={{
              flexDirection: "row",
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderBottomWidth: i < days.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              backgroundColor: row
                ? (i % 2 === 0 ? colors.surface + "80" : colors.surface + "40")
                : (i % 2 === 0 ? "transparent" : colors.surface + "20"),
            }}
          >
            <Text style={{
              flex: 0.8,
              color: row ? colors.primary : colors.textMuted,
              fontSize: fs.xs,
              fontWeight: row ? "700" : "400",
            }}>
              {String(day).padStart(2, "0")}
            </Text>
            <Text style={{ flex: 1, color: row ? colors.text : colors.textMuted, fontSize: fs.xs, textAlign: "right", fontWeight: row ? "600" : "400" }}>
              {row ? row.netWeight : "-"}
            </Text>
            <Text style={{ flex: 1, color: colors.textMuted, fontSize: fs.xs, textAlign: "right" }}>-</Text>
          </View>
        );
      })}

      {/* Total */}
      <View style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.surface, borderTopWidth: 2, borderTopColor: colors.primary }}>
        <Text style={{ flex: 0.8, color: colors.primary, fontSize: fs.xs, fontWeight: "700" }}>Total</Text>
        <Text style={{ flex: 1, color: colors.primary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>{totalNormal}</Text>
        <Text style={{ flex: 1, color: colors.textMuted, fontSize: fs.xs, textAlign: "right" }}>-</Text>
      </View>
    </Card>
  );
}
