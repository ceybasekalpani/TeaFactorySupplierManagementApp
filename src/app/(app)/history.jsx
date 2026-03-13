import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, ScreenHeader } from "../../components/ui";
import { useTheme } from "../../hooks/useTheme";
import { useApp } from "../../context/AppContext";

export default function HistoryScreen() {
  const { colors, fs, t } = useTheme();
  const { getSixMonthHistory, currentUser, activeReg, cashRequests } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const history = getSixMonthHistory();
  const maxNet = Math.max(...history.map((h) => h.totalNet), 1);

  const handleDownloadPDF = async () => {
    setDownloadLoading(true);
    // Simulate PDF generation
    await new Promise((r) => setTimeout(r, 1500));
    setDownloadLoading(false);

    // In a real app, use expo-print + expo-sharing
    Alert.alert(
      "PDF Ready",
      "Your annual statement has been generated and is ready to share.\n\n(In production, this uses expo-print and expo-sharing to create and share a real PDF.)",
      [
        { text: "Share", onPress: () => Alert.alert("Share", "Sharing PDF...") },
        { text: "OK" },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t.history}
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Summary card */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 20 }}>📊</Text>
            </View>
            <View>
              <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text }}>6 Month Overview</Text>
              <Text style={{ fontSize: fs.xs, color: colors.textSecondary }}>{currentUser?.name} · {activeReg?.regNo}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ color: colors.primary, fontSize: fs.xl, fontWeight: "800" }}>
                {history.reduce((s, h) => s + h.totalNet, 0)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fs.xs, textAlign: "center", marginTop: 2 }}>Total kg (6 months)</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ color: colors.accent, fontSize: fs.xl, fontWeight: "800" }}>
                {history.reduce((s, h) => s + h.days, 0)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fs.xs, textAlign: "center", marginTop: 2 }}>Collection Days</Text>
            </View>
          </View>
        </Card>

        {/* Bar chart */}
        <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
          Monthly Leaf Collection
        </Text>

        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: 150, gap: 8 }}>
            {history.map((month) => {
              const barHeight = maxNet > 0 ? (month.totalNet / maxNet) * 130 : 0;
              return (
                <View key={month.key} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: colors.primary, fontSize: fs.xs, fontWeight: "700", marginBottom: 4 }}>
                    {month.totalNet || "-"}
                  </Text>
                  <View style={{
                    width: "100%",
                    height: Math.max(barHeight, 4),
                    backgroundColor: colors.primary,
                    borderRadius: 6,
                    opacity: month.totalNet > 0 ? 1 : 0.2,
                  }} />
                  <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 4, textAlign: "center" }}>
                    {month.label.split(" ")[0]}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Monthly table */}
        <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
          Monthly Summary
        </Text>

        <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", backgroundColor: colors.surface, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ flex: 2, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700" }}>MONTH</Text>
            <Text style={{ flex: 1.5, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>GROSS</Text>
            <Text style={{ flex: 1.5, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>NET</Text>
            <Text style={{ flex: 1, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>DAYS</Text>
          </View>
          {history.map((m, i) => (
            <View key={m.key} style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: i < history.length - 1 ? 1 : 0, borderBottomColor: colors.border, backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "40" }}>
              <Text style={{ flex: 2, color: colors.text, fontSize: fs.xs, fontWeight: "600" }}>{m.label}</Text>
              <Text style={{ flex: 1.5, color: colors.text, fontSize: fs.xs, textAlign: "right" }}>{m.totalGross || "-"}</Text>
              <Text style={{ flex: 1.5, color: colors.primary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>{m.totalNet || "-"}</Text>
              <Text style={{ flex: 1, color: colors.textMuted, fontSize: fs.xs, textAlign: "right" }}>{m.days || "-"}</Text>
            </View>
          ))}
        </Card>

        {/* Download Statement */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Ionicons name="document-text" size={fs.xl} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: fs.sm, fontWeight: "700" }}>Annual Account Statement</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fs.xs }}>Download your full year statement as PDF</Text>
            </View>
          </View>
          <Button
            title={t.downloadStatement}
            onPress={handleDownloadPDF}
            loading={downloadLoading}
            icon="download"
          />
        </View>
      </ScrollView>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="history" />
    </SafeAreaView>
  );
}
