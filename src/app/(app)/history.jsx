import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, ScreenHeader } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

export default function HistoryScreen() {
  const { colors, fs, t } = useTheme();
  const { getSixMonthHistory, currentUser, activeReg } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const history = getSixMonthHistory();
  
  // Ensure history is an array and has data
  const historyArray = Array.isArray(history) ? history : [];
  const maxNet = Math.max(...historyArray.map((h) => h?.totalNet || 0), 1);

  const handleDownloadPDF = async () => {
    try {
      setDownloadLoading(true);

      if (!historyArray || historyArray.length === 0) {
        Alert.alert("No Data", "No history available to generate PDF");
        setDownloadLoading(false);
        return;
      }

      const totalNet = historyArray.reduce((s, h) => s + (h?.totalNet || 0), 0);
      const totalDays = historyArray.reduce((s, h) => s + (h?.days || 0), 0);

      const tableRows = historyArray
        .map(
          (m) => `
          <tr>
            <td>${m?.label ?? "-"}</td>
            <td>${m?.totalGross ?? "-"}</td>
            <td>${m?.totalNet ?? "-"}</td>
            <td>${m?.days ?? "-"}</td>
          </tr>
        `
        )
        .join("");

      const html = `
        <html>
          <head>
            <style>
              body{
                font-family: Arial;
                padding:20px;
              }
              h1{
                text-align:center;
              }
              table{
                width:100%;
                border-collapse:collapse;
                margin-top:20px;
              }
              th,td{
                border:1px solid #ccc;
                padding:8px;
                text-align:center;
              }
              th{
                background:#f2f2f2;
              }
            </style>
          </head>

          <body>

            <h1>Annual Leaf Collection Statement</h1>

            <p><b>Name:</b> ${currentUser?.name ?? "-"}</p>
            <p><b>Registration No:</b> ${activeReg?.regNo ?? "-"}</p>

            <h3>6 Month Summary</h3>
            <p>Total Net KG: ${totalNet}</p>
            <p>Total Collection Days: ${totalDays}</p>

            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Gross</th>
                  <th>Net</th>
                  <th>Days</th>
                </tr>
              </thead>

              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <p style="margin-top:30px">
              Generated on ${new Date().toLocaleDateString()}
            </p>

          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: html,
      });

      const fileName = `LeafStatement_${activeReg?.regNo || "supplier"}_${Date.now()}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });

      setDownloadLoading(false);

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("PDF Saved", `Saved to: ${fileUri}`);
      }

    } catch (error) {
      console.log(error);
      setDownloadLoading(false);
      Alert.alert("Error", "Failed to generate PDF");
    }
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
                {historyArray.reduce((s, h) => s + (h?.totalNet || 0), 0)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fs.xs, textAlign: "center", marginTop: 2 }}>Total kg (6 months)</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ color: colors.accent, fontSize: fs.xl, fontWeight: "800" }}>
                {historyArray.reduce((s, h) => s + (h?.days || 0), 0)}
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
            {historyArray.length > 0 ? (
              historyArray.map((month, index) => {
                const totalNet = month?.totalNet ?? 0;
                const barHeight = maxNet > 0 ? (totalNet / maxNet) * 130 : 0;
                const monthLabel = month?.label || `Month ${index + 1}`;
                const shortMonth = monthLabel.split(" ")[0];

                return (
                  <View key={month?.key || index} style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: colors.primary, fontSize: fs.xs, fontWeight: "700", marginBottom: 4 }}>
                      {totalNet > 0 ? totalNet : ""}
                    </Text>
                    <View style={{
                      width: "100%",
                      height: Math.max(barHeight, 4),
                      backgroundColor: colors.primary,
                      borderRadius: 6,
                      opacity: totalNet > 0 ? 1 : 0.2,
                    }} />
                    <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 4, textAlign: "center" }}>
                      {shortMonth}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={{ flex: 1, alignItems: "center", padding: 20 }}>
                <Text style={{ color: colors.textSecondary }}>No monthly data available</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Monthly table */}
        <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
          Monthly Summary
        </Text>

        <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          {/* Table Header */}
          <View style={{
            flexDirection: "row",
            backgroundColor: colors.primary + "10",
            paddingVertical: 14,
            paddingHorizontal: 14,
            borderBottomWidth: 2,
            borderBottomColor: colors.primary,
          }}>
            <Text style={{ flex: 2, color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>MONTH</Text>
            <Text style={{ flex: 1.5, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "right" }}>GROSS (kg)</Text>
            <Text style={{ flex: 1.5, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "right" }}>NET (kg)</Text>
            <Text style={{ flex: 1, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "right" }}>DAYS</Text>
          </View>

          {/* Table Rows */}
          {historyArray.length > 0 ? (
            historyArray.map((m, i) => (
              <View
                key={m?.key || i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  paddingHorizontal: 14,
                  borderBottomWidth: i < historyArray.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "40",
                }}
              >
                <Text style={{ flex: 2, color: colors.text, fontSize: fs.sm, fontWeight: "600" }}>{m?.label ?? "-"}</Text>
                <Text style={{ flex: 1.5, color: colors.text, fontSize: fs.sm, textAlign: "right" }}>{m?.totalGross ?? 0}</Text>
                <Text style={{ flex: 1.5, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "right" }}>{m?.totalNet ?? 0}</Text>
                <Text style={{ flex: 1, color: colors.textSecondary, fontSize: fs.sm, textAlign: "right" }}>{m?.days ?? 0}</Text>
              </View>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: colors.textSecondary }}>No monthly data available</Text>
            </View>
          )}

          {/* Summary Footer */}
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 14,
            paddingHorizontal: 14,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            <Text style={{ color: colors.textSecondary, fontSize: fs.sm }}>
              Total Days: {historyArray.reduce((s, m) => s + (m?.days ?? 0), 0)}
            </Text>
            <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>
              Total Net: {historyArray.reduce((s, m) => s + (m?.totalNet ?? 0), 0)} kg
            </Text>
          </View>
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