import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import SidebarMenu from "../../components/SidebarMenu";
import { ScreenHeader, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { buildCashRequestSchema } from "../../schemas/cashRequestSchema";
import { DatePickerModal } from "./components/DatePickerModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { RequestFormCard } from "./components/RequestFormCard";
import { RequestHistoryTable } from "./components/RequestHistoryTable";
import { useAdvanceLimit } from "./hooks/useAdvanceLimit";
import { formatCurrency } from "./utils/formatters";
import { useToast } from "../requests/hooks/useToast";

const SHOW_LOAN = false;

export default function CashRequestScreen() {
  const { colors, fs, t } = useTheme();
  const { cashRequests, addCashRequest, deleteCashRequest, currentUser, activeReg, refreshRequests } = useApp();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useToast();
  const advanceLimit = useAdvanceLimit();
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

  const handleRequest = async () => {
    const validation = buildCashRequestSchema(t, advanceLimit, formatCurrency).safeParse({ amount });
    if (!validation.success) {
      showToast(validation.error.issues[0].message, "error");
      return;
    }
    const amountNum = parseFloat(amount);
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

  const amountNum = parseFloat(amount) || 0;

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

          <RequestFormCard
            colors={colors} fs={fs} t={t}
            advanceLimit={advanceLimit} amount={amount} setAmount={setAmount} amountNum={amountNum}
            prevMonthLabel={prevMonthLabel} currentMonthLabel={currentMonthLabel}
            selectedMonthKey={selectedMonthKey} setSelectedMonthKey={setSelectedMonthKey}
            selectedDate={selectedDate} onOpenCalendar={() => setCalendarVisible(true)}
            loading={loading} onSubmit={handleRequest}
          />

          <RequestHistoryTable
            colors={colors} fs={fs} t={t}
            advanceRequests={advanceRequests}
            onRequestDelete={setDeleteConfirm}
          />
        </ScrollView>
      </KeyboardView>

      <DatePickerModal
        colors={colors} fs={fs} t={t}
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        calendarMonth={calendarMonth}
        onMonthChange={(month) => {
          const year = month.year;
          const monthNum = String(month.month).padStart(2, "0");
          setCalendarMonth(`${year}-${monthNum}-01`);
        }}
        selectedDate={selectedDate}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          setCalendarVisible(false);
        }}
      />

      <DeleteConfirmModal
        colors={colors} fs={fs} t={t}
        deleteConfirm={deleteConfirm}
        deleteLoading={deleteLoading}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
      />

      <Toast message={toast.message} visible={toast.visible} type={toast.type} onDismiss={() => {}} />
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="advanceRequest" />
    </SafeAreaView>
  );
}
