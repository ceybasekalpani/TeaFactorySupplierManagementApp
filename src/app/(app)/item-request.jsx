import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, EmptyState, Input, Picker, ScreenHeader, StatusBadge, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const ITEM_TYPES = [
  { value: "Pruning Shears", label: "Pruning Shears" },
  { value: "Harvesting Bag", label: "Harvesting Bag" },
  { value: "Gloves", label: "Protective Gloves" },
  { value: "Rain Coat", label: "Rain Coat" },
  { value: "Basket", label: "Bamboo Basket" },
  { value: "Knife", label: "Harvesting Knife" },
  { value: "Weighing Bag", label: "Weighing Bag" },
  { value: "Sun Hat", label: "Sun Hat" },
];

export default function ItemRequestScreen() {
  const { colors, fs } = useTheme();
  const { itemRequests, addItemRequest, currentUser, activeReg } = useApp();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [itemType, setItemType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  // Generate last 12 months dynamically
  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toLocaleString("default", { month: "short", year: "numeric" });
      options.push({ value, label: value });
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
    if (!itemType) {
      showToast("Please select item type", "error");
      return;
    }
    if (!quantity) {
      showToast("Please enter quantity", "error");
      return;
    }
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      showToast("Please enter a valid quantity greater than 0", "error");
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
      const newRequest = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        month: selectedMonth,
        itemType,
        quantity: quantityNum,
        userId: currentUser.id,
        regNo: activeReg.regNo,
        status: "pending",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      await addItemRequest(newRequest);
      setSelectedMonth("");
      setItemType("");
      setQuantity("");
      showToast("Request submitted successfully!");
    } catch (error) {
      console.error("Error submitting request:", error);
      showToast("Failed to submit request. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const sortedRequests = useMemo(() => {
    return (itemRequests || [])
      .filter(req => req)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [itemRequests]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString || "-";
    }
  };

  const totalQuantity = useMemo(() => {
    return sortedRequests.reduce((sum, req) => sum + (parseFloat(req.quantity) || 0), 0);
  }, [sortedRequests]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Item Request"
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Request Form */}
        <Card style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: "#fef3c7",
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
            <View>
              <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text }}>
                New Item Request
              </Text>
              <Text style={{ fontSize: fs.xs, color: colors.textSecondary }}>
                {currentUser?.name || "Guest"} • {activeReg?.regNo || "No registration"}
              </Text>
            </View>
          </View>

          <Picker
            label="Select Month"
            value={selectedMonth}
            options={monthOptions}
            onSelect={setSelectedMonth}
            placeholder="Choose a month"
          />
          <Picker
            label="Item Type"
            value={itemType}
            options={ITEM_TYPES}
            onSelect={setItemType}
            placeholder="Select item type"
          />
          <Input
            label="Quantity (units)"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Enter quantity"
            keyboardType="numeric"
          />

          <Button
            title="Submit Request"
            onPress={handleRequest}
            loading={loading}
            icon="send-outline"
          />
        </Card>

        {/* Request History */}
        <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
          Request History {sortedRequests.length > 0 && `(${sortedRequests.length})`}
        </Text>

        {sortedRequests.length === 0 ? (
          <Card>
            <EmptyState
              icon="cube-outline"
              message="No item requests yet"
              description="Your item request history will appear here"
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
              <Text style={{ flex: 1.5, color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>ITEM</Text>
              <Text style={{ flex: 1, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>QTY</Text>
              <Text style={{ flex: 1.2, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>STATUS</Text>
            </View>

            {/* Table Rows */}
            {sortedRequests.map((req, i) => (
              <View
                key={req.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  paddingHorizontal: 14,
                  borderBottomWidth: i < sortedRequests.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "40",
                }}
              >
                <Text numberOfLines={1} style={{ flex: 2, color: colors.text, fontSize: fs.sm, fontWeight: "500" }}>
                  {formatDate(req.createdAt || req.date)}
                </Text>
                <Text numberOfLines={1} style={{ flex: 1.5, color: colors.textSecondary, fontSize: fs.sm }}>
                  {req.itemType || "-"}
                </Text>
                <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: fs.sm, fontWeight: "600", textAlign: "center" }}>
                  {req.quantity ?? "-"}
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
                Total Requests: {sortedRequests.length}
              </Text>
              <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>
                Total: {totalQuantity} units
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
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="itemRequest" />
    </SafeAreaView>
  );
}
