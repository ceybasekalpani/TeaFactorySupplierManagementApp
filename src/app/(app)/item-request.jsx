import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, EmptyState, Input, Picker, ScreenHeader, StatusBadge, Toast } from "../../components/ui";
import { useTheme } from "../../hooks/useTheme";
import { useApp } from "../../context/AppContext";

const MONTHS = [
  { value: "Jan 2026", label: "Jan 2026" },
  { value: "Feb 2026", label: "Feb 2026" },
  { value: "Mar 2026", label: "Mar 2026" },
  { value: "Dec 2025", label: "Dec 2025" },
  { value: "Nov 2025", label: "Nov 2025" },
];

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
  const { colors, fs, t } = useTheme();
  const { itemRequests, addItemRequest } = useApp();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [month, setMonth] = useState("");
  const [itemType, setItemType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const handleRequest = async () => {
    if (!month || !itemType || !quantity) {
      showToast(t.fillAllFields, "error");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    addItemRequest(month, itemType, quantity);
    setLoading(false);
    setMonth("");
    setItemType("");
    setQuantity("");
    showToast(t.successRequest);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t.itemRequest}
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "#fef3c7",
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 20 }}>📦</Text>
            </View>
            <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text }}>
              New Item Request
            </Text>
          </View>

          <Picker label={t.selectMonth} value={month} options={MONTHS} onSelect={setMonth} placeholder={t.selectMonth} />
          <Picker label={t.itemType} value={itemType} options={ITEM_TYPES} onSelect={setItemType} placeholder="Select Item Type" />
          <Input label={`${t.quantity} (units)`} value={quantity} onChangeText={setQuantity} placeholder="e.g. 2" keyboardType="numeric" />

          <Button title={t.request} onPress={handleRequest} loading={loading} icon="send" />
        </Card>

        <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Request History</Text>

        {itemRequests.length === 0 ? (
          <Card><EmptyState icon="cube-outline" message="No item requests yet" /></Card>
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", backgroundColor: colors.surface, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ flex: 2, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700" }}>{t.date}</Text>
              <Text style={{ flex: 2, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700" }}>ITEM</Text>
              <Text style={{ flex: 1.5, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>{t.quantity}</Text>
              <Text style={{ flex: 2, color: colors.textSecondary, fontSize: fs.xs, fontWeight: "700", textAlign: "right" }}>{t.status}</Text>
            </View>
            {itemRequests.map((req, i) => (
              <View key={req.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: i < itemRequests.length - 1 ? 1 : 0, borderBottomColor: colors.border, backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "40" }}>
                <Text style={{ flex: 2, color: colors.text, fontSize: fs.xs }}>{req.date}</Text>
                <Text style={{ flex: 2, color: colors.textSecondary, fontSize: fs.xs }}>{req.itemType}</Text>
                <Text style={{ flex: 1.5, color: colors.text, fontSize: fs.xs, fontWeight: "600", textAlign: "right" }}>{req.quantity}</Text>
                <View style={{ flex: 2, alignItems: "flex-end" }}><StatusBadge status={req.status} /></View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="itemRequest" />
    </SafeAreaView>
  );
}
