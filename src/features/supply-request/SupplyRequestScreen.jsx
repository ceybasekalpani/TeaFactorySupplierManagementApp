import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import SidebarMenu from "../../components/SidebarMenu";
import { ScreenHeader, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { buildSupplyRequestSchema } from "../../schemas/supplyRequestSchema";
import { useToast } from "../requests/hooks/useToast";
import { CombinedHistoryTable } from "./components/CombinedHistoryTable";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { RequestFormCard } from "./components/RequestFormCard";
import { useSupplyTypeOptions } from "./hooks/useSupplyTypeOptions";

export default function SupplyRequestScreen() {
  const { colors, t } = useTheme();
  const {
    fertilizerRequests, addFertilizerRequest, deleteFertilizerRequest,
    itemRequests, addItemRequest, deleteItemRequest,
    currentUser, activeReg, refreshRequests,
    fertilizerTypes, itemTypes, supplyTypesLoading, refreshSupplyTypes,
  } = useApp();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState("fertilizer");
  const [selectedType, setSelectedType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { toast, showToast } = useToast();

  useEffect(() => {
    setSelectedType("");
    setQuantity("");
    setUnit("kg");
  }, [category]);

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const currentTypes = useSupplyTypeOptions({ category, fertilizerTypes, itemTypes, selectedType, setSelectedType });

  const quantityLabel = `${t.quantity} (${
    category === "fertilizer"
      ? `${t.unitKg ?? "kg"} / ${t.unitNos ?? "Nos"}`
      : (t.unitUnits ?? "units")
  })`;
  const quantityPlaceholder = category === "fertilizer"
    ? unit === "kg"
      ? (t.enterQuantityKg ?? "Enter quantity in kg")
      : (t.enterQuantityNos ?? "Enter quantity in Nos")
    : (t.enterQuantityUnits ?? "Enter quantity in units");

  const handleRequest = async () => {
    const validation = buildSupplyRequestSchema(t, category).safeParse({ selectedType, quantity });
    if (!validation.success) {
      showToast(validation.error.issues[0].message, "error");
      return;
    }
    const quantityNum = parseFloat(quantity);
    if (!currentUser) {
      showToast(t.pleaseLoginToRequest, "error");
      return;
    }
    if (!activeReg) {
      showToast(t.noActiveRegistration, "error");
      return;
    }

    setLoading(true);
    try {
      if (category === "fertilizer") {
        await addFertilizerRequest({
          month: currentMonth,
          fertilizerType: selectedType,
          quantity: quantityNum,
          unit: unit,
        });
      } else {
        await addItemRequest({
          month: currentMonth,
          itemType: selectedType,
          quantity: quantityNum,
          unit: "units",
        });
      }
      setSelectedType("");
      setQuantity("");
      setUnit("kg");
      showToast(t.successRequest);
    } catch (error) {
      console.log("Request error:", error);
      showToast(error?.message || t.failedToSubmitRequest, "error");
    } finally {
      setLoading(false);
    }
  };

  const combinedHistory = useMemo(() => {
    const fReqs = (fertilizerRequests || []).map((r) => ({
      ...r,
      category: "Fertilizer",
      displayType: r.fertType || r.fertilizerType || "-",
    }));
    const iReqs = (itemRequests || []).map((r) => ({
      ...r,
      category: "Other Item",
      displayType: r.itemType || "-",
    }));
    const list = category === "fertilizer" ? fReqs : iReqs;
    return list
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [fertilizerRequests, itemRequests, category]);

  const handleDelete = async (req) => {
    setDeleteLoading(true);
    try {
      if (req.category === "Fertilizer") {
        await deleteFertilizerRequest(req.id);
      } else {
        await deleteItemRequest(req.id);
      }
      showToast(t.deleteSuccess ?? "Request deleted");
    } catch {
      showToast(t.deleteFailed ?? "Failed to delete", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      refreshRequests(),
      refreshSupplyTypes(),
    ]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <ScreenHeader
        title={t.fertilizerItemRequest}
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <KeyboardView>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View className="px-4 pt-4 pb-[60px]">
            <RequestFormCard
              colors={colors} t={t}
              currentUser={currentUser} activeReg={activeReg}
              category={category} setCategory={setCategory} currentMonth={currentMonth}
              selectedType={selectedType} setSelectedType={setSelectedType}
              currentTypes={currentTypes} supplyTypesLoading={supplyTypesLoading}
              unit={unit} setUnit={setUnit}
              quantity={quantity} setQuantity={setQuantity}
              quantityLabel={quantityLabel} quantityPlaceholder={quantityPlaceholder}
              loading={loading} onSubmit={handleRequest}
            />

            <CombinedHistoryTable
              t={t}
              combinedHistory={combinedHistory}
              onRequestDelete={setDeleteConfirm}
            />
          </View>
        </ScrollView>
      </KeyboardView>

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onDismiss={() => {}}
      />
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="fertilizerItemRequest" />

      <DeleteConfirmModal
        t={t}
        deleteConfirm={deleteConfirm}
        deleteLoading={deleteLoading}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
      />
    </SafeAreaView>
  );
}
