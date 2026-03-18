import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, EmptyState, Input, Picker, ScreenHeader, StatusBadge, Toast, ToggleTabs } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

export default function CashRequestScreen() {
  const { colors, fs, t } = useTheme();
  const { cashRequests, addCashRequest, currentUser, activeReg } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("advance");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  // Generate last 12 months dynamically
  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const value = `${monthStr} ${year}`;
      
      options.push({
        value: value,
        label: value
      });
    }
    
    return options;
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const handleRequest = async () => {
    if (!selectedMonth) {
      showToast("Please select a month", "error");
      return;
    }
    
    if (!amount) {
      showToast("Please enter amount", "error");
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid amount greater than 0", "error");
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
      const now = new Date();
      
      // Create new request object with all required fields
      const newRequest = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: activeTab,
        month: selectedMonth,
        amount: amountNum,
        userId: currentUser.id,
        regNo: activeReg.regNo,
        status: "pending",
        createdAt: now.toISOString(),
        requestedDate: now.toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        updatedAt: now.toISOString()
      };
      
      // Add the cash request to context
      await addCashRequest(newRequest);
      
      // Reset form
      setSelectedMonth("");
      setAmount("");
      
      showToast("Request submitted successfully!");
      
    } catch (error) {
      console.error("Error submitting request:", error);
      showToast("Failed to submit request. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Separate filters for advance and loan requests
  const advanceRequests = useMemo(() => {
    return (cashRequests || [])
      .filter(r => r && r.type === "advance")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [cashRequests]);

  const loanRequests = useMemo(() => {
    return (cashRequests || [])
      .filter(r => r && r.type === "loan")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [cashRequests]);

  // Get current filtered requests based on active tab
  const filteredRequests = activeTab === "advance" ? advanceRequests : loanRequests;

  const tabs = [
    { key: "advance", label: "Advance Request" },
    { key: "loan", label: "Loan Request" },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString || "-";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0";
    try {
      return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } catch {
      return "0";
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Cash Request"
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <ToggleTabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

        {/* Request Form */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 20 }}>
            {activeTab === "advance" ? "New Advance Request" : "New Loan Request"}
          </Text>

          <Picker
            label="Select Month"
            value={selectedMonth}
            options={monthOptions}
            onSelect={setSelectedMonth}
            placeholder="Choose a month"
          />

          <Input
            label="Amount (Rs)"
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
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
              marginBottom: 20,
            }}>
              <Ionicons name="information-circle" size={fs.lg} color="#d97706" />
              <Text style={{ color: "#92400e", fontSize: fs.xs, flex: 1 }}>
                Advance requests not approved within 24 hours will be automatically rejected.
              </Text>
            </View>
          )}

          {activeTab === "loan" && (
            <View style={{
              backgroundColor: "#dbeafe",
              borderRadius: 10,
              padding: 12,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              marginBottom: 20,
            }}>
              <Ionicons name="information-circle" size={fs.lg} color="#2563eb" />
              <Text style={{ color: "#1e40af", fontSize: fs.xs, flex: 1 }}>
                Loan requests are subject to approval based on your collection history and credit score.
              </Text>
            </View>
          )}

          <Button
            title="Submit Request"
            onPress={handleRequest}
            loading={loading}
            icon="send-outline"
          />
        </Card>

        {/* History Table */}
        <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
          {activeTab === "advance" ? "Advance" : "Loan"} Request History 
          {filteredRequests.length > 0 && ` (${filteredRequests.length})`}
        </Text>

        {filteredRequests.length === 0 ? (
          <Card>
            <EmptyState 
              icon="document-text-outline" 
              message={`No ${activeTab} requests yet`}
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
            {filteredRequests.map((req, i) => (
              <View
                key={req.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  paddingHorizontal: 14,
                  borderBottomWidth: i < filteredRequests.length - 1 ? 1 : 0,
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
                  <StatusBadge 
                    status={req.status || "pending"} 
                    size="small"
                  />
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
                Total Requests: {filteredRequests.length}
              </Text>
              <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>
                Total: Rs. {formatCurrency(
                  filteredRequests.reduce((sum, req) => sum + (parseFloat(req.amount) || 0), 0)
                )}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      <Toast 
        message={toast.message} 
        visible={toast.visible} 
        type={toast.type} 
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
      
      <SidebarMenu 
        visible={menuOpen} 
        onClose={() => setMenuOpen(false)} 
        activeKey="cashRequest" 
      />
    </SafeAreaView>
  );
}