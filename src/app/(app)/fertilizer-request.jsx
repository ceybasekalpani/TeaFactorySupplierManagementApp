import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, EmptyState, Input, Picker, ScreenHeader, StatusBadge, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

// Fertilizer types (these are fixed categories)
const FERTILIZER_TYPES = [
  { value: "Urea", label: "Urea" },
  { value: "Potash", label: "Potash (MOP)" },
  { value: "TSP", label: "TSP (Triple Super Phosphate)" },
  { value: "Dolomite", label: "Dolomite" },
  { value: "NPK Mixture", label: "NPK Mixture" },
  { value: "Organic Compost", label: "Organic Compost" },
];

// Main component with default export
export default function FertilizerRequestScreen() {
  const { colors, fs, t } = useTheme();
  const { fertilizerRequests, addFertilizerRequest, currentUser, activeReg } = useApp();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [fertType, setFertType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const handleRequest = async () => {
    if (!fertType) {
      showToast("Please select fertilizer type", "error");
      return;
    }
    if (!activeReg) {
      showToast("No active registration found", "error");
      return;
    }
    const quantityNum = parseFloat(quantity) || 0;
    setLoading(true);
    try {
      await addFertilizerRequest({
        month: currentMonth,
        fertilizerType: fertType,
        quantity: quantityNum,
      });
      setFertType("");
      setQuantity("");
      showToast("Request submitted successfully!");
    } catch (error) {
      console.error("Error submitting request:", error);
      showToast("Failed to submit request. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Sort requests by date (newest first)
  const sortedRequests = useMemo(() => {
    return (fertilizerRequests || [])
      .filter(req => req)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [fertilizerRequests]);

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
        minute: '2-digit',
      });
    } catch {
      return dateString || "-";
    }
  };

  const formatQuantity = (qty) => {
    if (!qty && qty !== 0) return "0";
    try {
      return parseFloat(qty).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      });
    } catch {
      return "0";
    }
  };

  const totalQuantity = useMemo(() => {
    return sortedRequests.reduce((sum, req) => sum + (parseFloat(req.quantity) || 0), 0);
  }, [sortedRequests]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Fertilizer Request"
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Request Form */}
        <Card style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#dcfce7",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Text style={{ fontSize: 24 }}>🌿</Text>
            </View>
            <View>
              <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text }}>
                New Fertilizer Request
              </Text>
              <Text style={{ fontSize: fs.xs, color: colors.textSecondary }}>
                {currentUser?.name || "Guest"} • {activeReg?.regNo || "No registration"}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>Month</Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: colors.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
              paddingVertical: 13,
            }}>
              <Ionicons name="calendar-outline" size={fs.lg} color={colors.primary} />
              <Text style={{ color: colors.text, fontSize: fs.base, fontWeight: "600" }}>{currentMonth}</Text>
            </View>
          </View>

          <Picker
            label="Fertilizer Type"
            value={fertType}
            options={FERTILIZER_TYPES}
            onSelect={setFertType}
            placeholder="Select fertilizer type"
          />

          <Input
            label="Quantity (kg)"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Enter quantity in kg"
            keyboardType="numeric"
          />

          <View style={{
            backgroundColor: "#dbeafe",
            borderRadius: 10,
            padding: 12,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: 20,
          }}>
            <Text style={{ color: "#1e40af", fontSize: fs.xs, flex: 1 }}>
              ℹ️ Fertilizer requests are subject to availability and will be processed within 3-5 working days.
            </Text>
          </View>

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
              icon="leaf-outline"
              message="No fertilizer requests yet"
              description="Your fertilizer request history will appear here"
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
              <Text style={{ flex: 1.6, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center"  }}>REQUEST DATE</Text>
              <Text style={{ flex: 1.6, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center"  }}>TYPE</Text>
              <Text style={{ flex: 1.6, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>QTY (kg)</Text>
              <Text style={{ flex: 1.6, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>STATUS</Text>
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
                <Text numberOfLines={1} style={{ flex: 1.6, color: colors.text, fontSize: fs.sm, fontWeight: "500" }}>
                  {formatDate(req.createdAt || req.date)}
                </Text>
                <Text numberOfLines={1} style={{ flex: 1, color: colors.textSecondary, fontSize: fs.sm,textAlign: "left" }}>
                  {req.fertType || "-"}
                </Text>
                <Text style={{ flex: 1, color: colors.text, fontSize: fs.sm, fontWeight: "600", textAlign: "center" }}>
                  {formatQuantity(req.quantity)}
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
                Total: {formatQuantity(totalQuantity)} kg
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
        activeKey="fertilizerRequest" 
      />
    </SafeAreaView>
  );
}