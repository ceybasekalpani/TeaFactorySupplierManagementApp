import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, EmptyState, Input, Picker, ScreenHeader, StatusBadge, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { cashApi, tokenStorage } from "../../utils/api";

// Set to true to re-enable loan tab when backend is ready
const SHOW_LOAN = false;

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CashRequestScreen() {
  const { colors, fs, t } = useTheme();
  const { cashRequests, addCashRequest, currentUser, activeReg } = useApp();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [advanceLimit, setAdvanceLimit] = useState(null);

  // Month options: previous month and current month
  const now = new Date();
  const currentMonthInfo = { year: now.getFullYear(), month: now.getMonth() };
  const prevMonthInfo = now.getMonth() === 0
    ? { year: now.getFullYear() - 1, month: 11 }
    : { year: now.getFullYear(), month: now.getMonth() - 1 };

  const [selectedMonthKey, setSelectedMonthKey] = useState("current");

  const selectedMonthInfo = selectedMonthKey === "current" ? currentMonthInfo : prevMonthInfo;
  const daysInSelectedMonth = getDaysInMonth(selectedMonthInfo.year, selectedMonthInfo.month);

  const [selectedDay, setSelectedDay] = useState(String(now.getDate()));

  // Reset day when month changes
  useEffect(() => {
    if (selectedMonthKey === "prev") {
      setSelectedDay("1");
    } else {
      setSelectedDay(String(now.getDate()));
    }
  }, [selectedMonthKey]);

  const dayOptions = Array.from({ length: daysInSelectedMonth }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const selectedMonthLabel = new Date(selectedMonthInfo.year, selectedMonthInfo.month, 1)
    .toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonthLabel = new Date(prevMonthInfo.year, prevMonthInfo.month, 1)
    .toLocaleString("default", { month: "long", year: "numeric" });

  const currentMonthLabel = new Date(currentMonthInfo.year, currentMonthInfo.month, 1)
    .toLocaleString("default", { month: "long", year: "numeric" });

  // Fetch advance limit from backend
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.get();
        const result = await cashApi.advanceLimit(token);
        if (result?.limit !== undefined && result.limit !== null) {
          setAdvanceLimit(Number(result.limit));
        }
      } catch (_) {
        // Endpoint not implemented yet — silently ignore
      }
    })();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const handleRequest = async () => {
    if (!amount) {
      showToast("Please enter amount", "error");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid amount greater than 0", "error");
      return;
    }
    if (advanceLimit !== null && amountNum > advanceLimit) {
      showToast(`Amount exceeds your limit of Rs. ${formatCurrency(advanceLimit)}`, "error");
      return;
    }
    if (!currentUser) {
      showToast("Please login to make a request", "error");
      return;
    }
    if (!activeReg) {
      showToast("No active registration found", "error");
      return;
    }

    setLoading(true);
    try {
      await addCashRequest({
        type: "advance",
        month: selectedMonthLabel,
        amount: amountNum,
        date: `${selectedMonthInfo.year}-${String(selectedMonthInfo.month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`,
      });
      setAmount("");
      showToast("Request submitted successfully!");
    } catch (error) {
      showToast("Failed to submit request. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const advanceRequests = useMemo(() => {
    return (cashRequests || [])
      .filter(r => r && r.type === "advance")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [cashRequests]);

  // Loan requests — kept for future use when SHOW_LOAN = true
  const loanRequests = useMemo(() => {
    return (cashRequests || [])
      .filter(r => r && r.type === "loan")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [cashRequests]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-US", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return dateString || "-"; }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0";
    try {
      return parseFloat(amount).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } catch { return "0"; }
  };

  const amountNum = parseFloat(amount) || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Cash Request"
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <KeyboardView>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Loan tab — hidden temporarily, code preserved */}
          {SHOW_LOAN && (
            <View>
              {/* Loan tab UI goes here when re-enabled */}
              {loanRequests.map(() => null)}
            </View>
          )}

          {/* Advance Request Form */}
          <Card style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 20 }}>
              New Advance Request
            </Text>

            {/* Advance Limit Banner */}
            {advanceLimit !== null && (
              <View style={{
                backgroundColor: "#dcfce7",
                borderRadius: 10,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: "#16a34a20",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="shield-checkmark" size={fs.lg} color="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#166534", fontSize: fs.xs, fontWeight: "600" }}>Your Advance Limit</Text>
                  <Text style={{ color: "#166534", fontSize: fs.md, fontWeight: "800" }}>
                    Rs. {formatCurrency(advanceLimit)}
                  </Text>
                  {amountNum > 0 && (
                    <Text style={{ color: "#15803d", fontSize: fs.xs, marginTop: 2 }}>
                      Remaining after request: Rs. {formatCurrency(Math.max(0, advanceLimit - amountNum))}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Month Selector */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 8 }}>
                Select Month
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { key: "prev", label: prevMonthLabel },
                  { key: "current", label: currentMonthLabel },
                ].map((m) => {
                  const isActive = selectedMonthKey === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setSelectedMonthKey(m.key)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: isActive ? colors.primary : colors.border,
                        backgroundColor: isActive ? colors.primary + "15" : colors.surface,
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={fs.base}
                        color={isActive ? colors.primary : colors.textMuted}
                      />
                      <Text style={{
                        color: isActive ? colors.primary : colors.text,
                        fontSize: fs.xs,
                        fontWeight: isActive ? "700" : "500",
                        textAlign: "center",
                      }}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Day Selector */}
            <Picker
              label={`Day (${selectedMonthLabel})`}
              value={selectedDay}
              options={dayOptions}
              onSelect={setSelectedDay}
              placeholder="Select day"
            />

            {/* Amount Input */}
            <Input
              label={`Amount (Rs)${advanceLimit !== null ? `  ·  Max Rs. ${formatCurrency(advanceLimit)}` : ""}`}
              value={amount}
              onChangeText={(v) => {
                // Block input if it would exceed the limit
                if (advanceLimit !== null) {
                  const num = parseFloat(v);
                  if (!isNaN(num) && num > advanceLimit) return;
                }
                setAmount(v);
              }}
              placeholder="Enter amount"
              keyboardType="numeric"
            />

            {/* 24h auto-reject warning */}
            <View style={{
              backgroundColor: "#fef3c7",
              borderRadius: 10,
              padding: 12,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              marginBottom: 20,
            }}>
              <Ionicons name="information-circle" size={fs.lg} color="#d97706" />
              <Text style={{ color: "#92400e", fontSize: fs.xs, flex: 1 }}>
                Advance requests not approved within 24 hours will be automatically rejected.
              </Text>
            </View>

            <Button
              title="Submit Request"
              onPress={handleRequest}
              loading={loading}
              icon="send-outline"
            />
          </Card>

          {/* Advance Request History */}
          <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            Advance Request History{advanceRequests.length > 0 ? ` (${advanceRequests.length})` : ""}
          </Text>

          {advanceRequests.length === 0 ? (
            <Card>
              <EmptyState
                icon="document-text-outline"
                message="No advance requests yet"
                description="Your request history will appear here"
              />
            </Card>
          ) : (
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
                <Text style={{ flex: 2, color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>REQUEST DATE</Text>
                <Text style={{ flex: 1.5, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>MONTH</Text>
                <Text style={{ flex: 1.5, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "right" }}>AMOUNT (Rs)</Text>
                <Text style={{ flex: 1.2, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>STATUS</Text>
              </View>

              {/* Table Rows */}
              {advanceRequests.map((req, i) => (
                <View
                  key={req.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                    paddingHorizontal: 14,
                    borderBottomWidth: i < advanceRequests.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "40",
                  }}
                >
                  <Text style={{ flex: 2, color: colors.text, fontSize: fs.sm, fontWeight: "500" }}>
                    {formatDate(req.createdAt)}
                  </Text>
                  <Text style={{ flex: 1.5, color: colors.textSecondary, fontSize: fs.sm, textAlign: "center" }}>
                    {req.month || "-"}
                  </Text>
                  <Text style={{ flex: 1.5, color: colors.text, fontSize: fs.sm, fontWeight: "600", textAlign: "right" }}>
                    Rs. {formatCurrency(req.amount)}
                  </Text>
                  <View style={{ flex: 1.2, alignItems: "center" }}>
                    <StatusBadge status={req.status || "pending"} size="small" />
                  </View>
                </View>
              ))}

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
                  Total Requests: {advanceRequests.length}
                </Text>
                <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>
                  Total: Rs. {formatCurrency(
                    advanceRequests.reduce((sum, req) => sum + (parseFloat(req.amount) || 0), 0)
                  )}
                </Text>
              </View>
            </Card>
          )}
        </ScrollView>
      </KeyboardView>

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="cashRequest" />
    </SafeAreaView>
  );
}
