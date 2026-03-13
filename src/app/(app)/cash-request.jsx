import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, EmptyState, Input, Picker, ScreenHeader, StatusBadge, Toast, ToggleTabs } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const MONTHS = [
  { value: "Jan 2026", label: "Jan 2026" },
  { value: "Feb 2026", label: "Feb 2026" },
  { value: "Mar 2026", label: "Mar 2026" },
  { value: "Apr 2026", label: "Apr 2026" },
  { value: "May 2026", label: "May 2026" },
  { value: "Jun 2026", label: "Jun 2026" },
  { value: "Jul 2025", label: "Jul 2025" },
  { value: "Aug 2025", label: "Aug 2025" },
  { value: "Sep 2025", label: "Sep 2025" },
  { value: "Oct 2025", label: "Oct 2025" },
  { value: "Nov 2025", label: "Nov 2025" },
  { value: "Dec 2025", label: "Dec 2025" },
];

export default function CashRequestScreen() {
  const { colors, fs, t } = useTheme();
  const { cashRequests, addCashRequest } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("advance");
  const [menuOpen, setMenuOpen] = useState(false);
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const handleRequest = async () => {
    if (!month || !amount) {
      showToast(t.fillAllFields, "error");
      return;
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    addCashRequest(activeTab, month, amount);
    setLoading(false);
    setMonth("");
    setAmount("");
    showToast(t.successRequest);
  };

  const filteredRequests = cashRequests.filter((r) => r.type === activeTab);

  const tabs = [
    { key: "advance", label: t.advanceRequest },
    { key: "loan", label: t.loanRequest },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t.cashRequest}
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <ToggleTabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

        {/* Request Form */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            {activeTab === "advance" ? t.advanceRequest : t.loanRequest}
          </Text>

          <Picker
            label={t.selectMonth}
            value={month}
            options={MONTHS}
            onSelect={setMonth}
            placeholder={t.selectMonth}
          />

          <Input
            label={t.amountRs}
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 5000"
            keyboardType="numeric"
          />

          {activeTab === "advance" && (
            <View style={{
              backgroundColor: "#fef3c7",
              borderRadius: 10,
              padding: 12,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              marginBottom: 12,
            }}>
              <Ionicons name="information-circle" size={fs.lg} color="#d97706" />
              <Text style={{ color: "#92400e", fontSize: fs.xs, flex: 1 }}>
                Note: Advance requests not approved within 24 hours will be automatically rejected.
              </Text>
            </View>
          )}

          <Button
            title={t.request}
            onPress={handleRequest}
            loading={loading}
            icon="send"
          />
        </Card>

        {/* History Table */}
        <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
          Request History
        </Text>

        {filteredRequests.length === 0 ? (
          <Card>
            <EmptyState icon="cash-outline" message="No requests yet" />
          </Card>
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {/* Table Header */}
            <View style={{
              flexDirection: "row",
              backgroundColor: colors.surface,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
              <Text style={{ flex: 2, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700" }}>{t.date}</Text>
              <Text style={{ flex: 1.5, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700", textAlign: "center" }}>MONTH</Text>
              <Text style={{ flex: 2, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>{t.amount}</Text>
              <Text style={{ flex: 2, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>{t.status}</Text>
            </View>

            {filteredRequests.map((req, i) => (
              <View
                key={req.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderBottomWidth: i < filteredRequests.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "40",
                }}
              >
                <Text style={{ flex: 2, color: colors.text, fontSize: fs.xs }}>{req.date}</Text>
                <Text style={{ flex: 1.5, color: colors.textSecondary, fontSize: fs.xs, textAlign: "center" }}>{req.month}</Text>
                <Text style={{ flex: 2, color: colors.text, fontSize: fs.xs, fontWeight: "600", textAlign: "right" }}>
                  Rs. {req.amount.toLocaleString()}
                </Text>
                <View style={{ flex: 2, alignItems: "flex-end" }}>
                  <StatusBadge status={req.status} />
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="cashRequest" />
    </SafeAreaView>
  );
}
