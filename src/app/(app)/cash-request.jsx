import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, EmptyState, Input, ScreenHeader, StatusBadge, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { cashApi, tokenStorage } from "../../utils/api";

const SHOW_LOAN = false;

export default function CashRequestScreen() {
  const { colors, fs, t } = useTheme();
  const { cashRequests, addCashRequest, deleteCashRequest, currentUser, activeReg, refreshRequests } = useApp();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [advanceLimit, setAdvanceLimit] = useState(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const currentMonthInfo = { year: now.getFullYear(), month: now.getMonth() };
  const prevMonthInfo = now.getMonth() === 0
    ? { year: now.getFullYear() - 1, month: 11 }
    : { year: now.getFullYear(), month: now.getMonth() - 1 };

  const [selectedMonthKey, setSelectedMonthKey] = useState("current");
  const selectedMonthInfo = selectedMonthKey === "current" ? currentMonthInfo : prevMonthInfo;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calendarMonth, setCalendarMonth] = useState(todayStr);

  useEffect(() => {
    if (selectedMonthKey === "prev") {
      const y = prevMonthInfo.year;
      const m = String(prevMonthInfo.month + 1).padStart(2, "0");
      setSelectedDate(`${y}-${m}-01`);
      setCalendarMonth(`${y}-${m}-01`);
    } else {
      setSelectedDate(todayStr);
      setCalendarMonth(todayStr);
    }
  }, [selectedMonthKey]);

  const selectedMonthLabel = new Date(selectedMonthInfo.year, selectedMonthInfo.month, 1)
    .toLocaleString("default", { month: "long", year: "numeric" });
  const prevMonthLabel = new Date(prevMonthInfo.year, prevMonthInfo.month, 1)
    .toLocaleString("default", { month: "long", year: "numeric" });
  const currentMonthLabel = new Date(currentMonthInfo.year, currentMonthInfo.month, 1)
    .toLocaleString("default", { month: "long", year: "numeric" });

  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.get();
        const result = await cashApi.advanceLimit(token);
        if (result?.limit !== undefined && result.limit !== null) {
          setAdvanceLimit(Number(result.limit));
        }
      } catch (_) {}
    })();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const handleRequest = async () => {
    if (!amount) { showToast(t.pleaseEnterAmount, "error"); return; }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) { showToast(t.pleaseEnterValidAmount, "error"); return; }
    if (advanceLimit !== null && amountNum > advanceLimit) {
      showToast(`${t.amountExceedsLimit} Rs. ${formatCurrency(advanceLimit)}`, "error"); return;
    }
    if (!currentUser) { showToast(t.pleaseLoginToRequest, "error"); return; }
    if (!activeReg) { showToast(t.noActiveRegistration, "error"); return; }

    setLoading(true);
    try {
      await addCashRequest({
        type: "advance",
        month: selectedMonthLabel,
        amount: amountNum,
        date: selectedDate,
      });
      setAmount("");
      showToast(t.successRequest);
    } catch {
      showToast(t.failedToSubmitRequest, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await deleteCashRequest(id);
      showToast(t.deleteSuccess ?? "Request deleted successfully");
    } catch {
      showToast(t.deleteFailed ?? "Failed to delete request", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshRequests();
    setRefreshing(false);
  };

  const advanceRequests = useMemo(() =>
    (cashRequests || [])
      .filter(r => r && r.type === "advance")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [cashRequests]
  );

  const loanRequests = useMemo(() =>
    (cashRequests || [])
      .filter(r => r && r.type === "loan")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [cashRequests]
  );

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return dateString || "-"; }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0";
    try { return parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
    catch { return "0"; }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const [y, m, d] = dateStr.split("-");
      return new Date(Number(y), Number(m) - 1, Number(d))
        .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return dateStr; }
  };

  const amountNum = parseFloat(amount) || 0;

  // Fixed column widths — header and rows both use these so they always align
  const COL = {
    date:   160,
    month:  110,
    amount: 110,
    status: 100,
    action:  60,
  };
  const TABLE_MIN_WIDTH = COL.date + COL.month + COL.amount + COL.status + COL.action + 28; // +28 for paddingHorizontal*2

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t.advanceRequest}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {SHOW_LOAN && <View>{loanRequests.map(() => null)}</View>}

          <Card style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 20 }}>
              {t.newAdvanceRequest}
            </Text>

            {/* Advance Limit Banner */}
            {advanceLimit !== null && (
              <View style={{
                backgroundColor: "#dcfce7", borderRadius: 10, padding: 12,
                flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16,
              }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#16a34a20", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="shield-checkmark" size={fs.lg} color="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#166534", fontSize: fs.xs, fontWeight: "600" }}>{t.yourAdvanceLimit}</Text>
                  <Text style={{ color: "#166534", fontSize: fs.md, fontWeight: "800" }}>Rs. {formatCurrency(advanceLimit)}</Text>
                  {amountNum > 0 && (
                    <Text style={{ color: "#15803d", fontSize: fs.xs, marginTop: 2 }}>
                      {t.remainingAfterRequest}: Rs. {formatCurrency(Math.max(0, advanceLimit - amountNum))}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Month Selector */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 8 }}>
                {t.selectMonth}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[{ key: "prev", label: prevMonthLabel }, { key: "current", label: currentMonthLabel }].map((m) => {
                  const isActive = selectedMonthKey === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setSelectedMonthKey(m.key)}
                      style={{
                        flex: 1, paddingVertical: 10, paddingHorizontal: 8,
                        borderRadius: 10, borderWidth: 1.5,
                        borderColor: isActive ? colors.primary : colors.border,
                        backgroundColor: isActive ? colors.primary + "15" : colors.surface,
                        alignItems: "center", gap: 4,
                      }}
                    >
                      <Ionicons name="calendar-outline" size={fs.base} color={isActive ? colors.primary : colors.textMuted} />
                      <Text style={{ color: isActive ? colors.primary : colors.text, fontSize: fs.xs, fontWeight: isActive ? "700" : "500", textAlign: "center" }}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Calendar Date Picker */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 8 }}>
                {t.date ?? "Date"}
              </Text>
              <TouchableOpacity
                onPress={() => setCalendarVisible(true)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 10,
                  backgroundColor: colors.surface, borderRadius: 10,
                  borderWidth: 1.5, borderColor: colors.border,
                  paddingHorizontal: 14, paddingVertical: 13,
                }}
              >
                <Ionicons name="calendar" size={fs.lg} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: fs.base, fontWeight: "600", flex: 1 }}>
                  {formatDisplayDate(selectedDate)}
                </Text>
                <Ionicons name="chevron-down" size={fs.base} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <Input
              label={`${t.amountRs}${advanceLimit !== null ? `  ·  ${t.max} Rs. ${formatCurrency(advanceLimit)}` : ""}`}
              value={amount}
              onChangeText={(v) => {
                if (advanceLimit !== null) {
                  const num = parseFloat(v);
                  if (!isNaN(num) && num > advanceLimit) return;
                }
                setAmount(v);
              }}
              placeholder={t.enterAmount}
              keyboardType="numeric"
            />

            <View style={{
              backgroundColor: "#fef3c7", borderRadius: 10, padding: 12,
              flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 20,
            }}>
              <Ionicons name="information-circle" size={fs.lg} color="#d97706" />
              <Text style={{ color: "#92400e", fontSize: fs.xs, flex: 1 }}>{t.autoRejectWarning}</Text>
            </View>

            <Button title={t.submitRequest} onPress={handleRequest} loading={loading} icon="send-outline" />
          </Card>

          {/* History */}
          <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            {t.advanceRequestHistory}{advanceRequests.length > 0 ? ` (${advanceRequests.length})` : ""}
          </Text>

          {advanceRequests.length === 0 ? (
            <Card>
              <EmptyState icon="document-text-outline" message={t.noAdvanceRequestsYet} description={t.requestHistoryWillAppear} />
            </Card>
          ) : (
            <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
              {/* ── Horizontal scroll wrapper for responsive table ── */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ minWidth: TABLE_MIN_WIDTH, flexGrow: 1 }}
                bounces={false}
              >
                <View style={{ flex: 1, minWidth: TABLE_MIN_WIDTH }}>

                  {/* Table Header */}
                  <View style={{
                    flexDirection: "row", backgroundColor: colors.primary + "10",
                    paddingVertical: 14, paddingHorizontal: 14,
                    borderBottomWidth: 2, borderBottomColor: colors.primary,
                  }}>
                    <Text style={{ width: COL.date, color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>
                      {t.requestDate?.charAt(0).toUpperCase() + t.requestDate?.slice(1).toLowerCase() || "Date"}
                    </Text>

                    <Text style={{ width: COL.month, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>
                      {t.month?.charAt(0).toUpperCase() + t.month?.slice(1).toLowerCase() || "Month"}
                    </Text>

                    <Text style={{ width: COL.amount, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "right", marginRight: 8 }}>
                      Amount(Rs)
                    </Text>

                    <Text style={{ width: COL.status, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>
                      {t.status?.charAt(0).toUpperCase() + t.status?.slice(1).toLowerCase() || "Status"}
                    </Text>

                    <Text style={{ width: COL.action, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>
                      {(t.action ?? "Action")?.charAt(0).toUpperCase() + (t.action ?? "Action")?.slice(1).toLowerCase()}
                    </Text>
                  </View>

                  {/* Table Rows */}
                  {advanceRequests.map((req, i) => (
                    <View
                      key={req.id}
                      style={{
                        flexDirection: "row", alignItems: "center",
                        paddingVertical: 16, paddingHorizontal: 14,
                        borderBottomWidth: i < advanceRequests.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                        backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "40",
                      }}
                    >
                      <Text style={{ width: COL.date, color: colors.text, fontSize: fs.sm, fontWeight: "500" }}>
                        {formatDate(req.createdAt)}
                      </Text>
                      <Text style={{ width: COL.month, color: colors.textSecondary, fontSize: fs.sm, textAlign: "center" }}>
                        {req.month || "-"}
                      </Text>
                      <Text style={{ width: COL.amount, color: colors.text, fontSize: fs.sm, fontWeight: "600", textAlign: "right", marginRight: 8 }}>
                        Rs. {formatCurrency(req.amount)}
                      </Text>
                      <View style={{ width: COL.status, alignItems: "center" }}>
                        <StatusBadge status={req.status || "pending"} size="small" />
                      </View>
                      {/* Delete button — only for pending */}
                      <View style={{ width: COL.action, alignItems: "center" }}>
                        {(req.status === "pending" || req.status === "Pending") && (
                          <TouchableOpacity onPress={() => setDeleteConfirm(req.id)}>
                            <Ionicons name="trash-outline" size={fs.lg} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}

                  {/* Table Footer */}
                  <View style={{
                    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                    paddingVertical: 14, paddingHorizontal: 14,
                    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
                  }}>
                    <Text style={{ color: colors.textSecondary, fontSize: fs.sm }}>
                      {t.totalRequests}: {advanceRequests.length}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>
                      {t.total}: Rs. {formatCurrency(advanceRequests.reduce((sum, req) => sum + (parseFloat(req.amount) || 0), 0))}
                    </Text>
                  </View>

                </View>
              </ScrollView>
              {/* ── End horizontal scroll wrapper ── */}
            </Card>
          )}
        </ScrollView>
      </KeyboardView>

      {/* Calendar Modal */}
      <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "center", padding: 20 }}
          activeOpacity={1}
          onPress={() => setCalendarVisible(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={{ backgroundColor: colors.bg, borderRadius: 16, overflow: "hidden" }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, textAlign: "center" }}>
                  {t.date ?? "Select Date"}
                </Text>
              </View>
              <Calendar
                current={calendarMonth}
                onMonthChange={(month) => {
                  const year = month.year;
                  const monthNum = String(month.month).padStart(2, "0");
                  setCalendarMonth(`${year}-${monthNum}-01`);
                }}
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setCalendarVisible(false);
                }}
                markedDates={{
                  [selectedDate]: { selected: true, selectedColor: colors.primary },
                }}
                theme={{
                  backgroundColor: colors.bg,
                  calendarBackground: colors.bg,
                  textSectionTitleColor: colors.textSecondary,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: "#fff",
                  todayTextColor: colors.primary,
                  dayTextColor: colors.text,
                  textDisabledColor: colors.border,
                  monthTextColor: colors.text,
                  arrowColor: colors.primary,
                }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
        <View style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
              {t.confirm ?? "Confirm"}
            </Text>
            <Text style={{ fontSize: fs.sm, color: colors.textSecondary, marginBottom: 24 }}>
              {t.deleteConfirmMessage ?? "Are you sure you want to delete this request?"}
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#ef4444", alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {deleteLoading ? "..." : (t.delete ?? "Delete")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="advanceRequest" />
    </SafeAreaView>
  );
}
