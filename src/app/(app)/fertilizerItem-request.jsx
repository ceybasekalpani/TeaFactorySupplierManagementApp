// fertilizerItem-request.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, EmptyState, Input, Picker, ScreenHeader, StatusBadge, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

export default function FertilizerItemRequestScreen() {
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

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  useEffect(() => {
    setSelectedType("");
    setQuantity("");
    setUnit("kg");
  }, [category]);

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const currentTypes = useMemo(() => {
    const toPickerOption = (type) => {
      const value = typeof type === "string"
        ? type
        : (type?.name ?? type?.Name ?? type?.type ?? type?.Type ?? type?.value ?? type?.Value ?? "");
      return { value, label: value };
    };

    return (category === "fertilizer" ? fertilizerTypes : itemTypes)
      .map(toPickerOption)
      .filter((type) => type.value);
  }, [category, fertilizerTypes, itemTypes]);

  useEffect(() => {
    if (selectedType && !currentTypes.some((type) => type.value === selectedType)) {
      setSelectedType("");
    }
  }, [currentTypes, selectedType]);

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

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const handleRequest = async () => {
    if (!selectedType) {
      showToast(category === "fertilizer" ? t.pleaseSelectFertilizerType : t.pleaseSelectItemType, "error");
      return;
    }
    if (!quantity.trim()) {
      showToast(t.pleaseEnterQuantity, "error");
      return;
    }
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      showToast(t.pleaseEnterValidQuantity, "error");
      return;
    }
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
    return [...fReqs, ...iReqs]
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [fertilizerRequests, itemRequests]);

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

  const formatQty = (qty, unitValue) => {
    if (!qty && qty !== 0) return "-";
    try {
      const n = parseFloat(qty).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      });
      const unitLabel =
        unitValue === "kg"    ? t.unitKg    :
        unitValue === "units" ? t.unitUnits :
        unitValue === "Nos"   ? t.unitNos   : unitValue;
      return `${n} ${unitLabel}`;
    } catch {
      return "-";
    }
  };

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

  const titleText = "text-[19px] font-bold text-[#212121] dark:text-white";
  const labelText = "text-[13px] font-semibold text-[#757575] dark:text-[#b0b0b0]";
  const mutedText = "text-[11px] text-[#757575] dark:text-[#b0b0b0]";

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
            <Card className="mb-6">
              <View className="mb-5 flex-row items-center gap-2.5">
                <View className={`h-12 w-12 items-center justify-center rounded-full ${category === "fertilizer" ? "bg-[#dcfce7]" : "bg-[#fef3c7]"}`}>
                  <Ionicons
                    name={category === "fertilizer" ? "leaf-outline" : "cube-outline"}
                    size={24}
                    color={category === "fertilizer" ? "#16a34a" : "#d97706"}
                  />
                </View>
                <View>
                  <Text className={titleText}>
                    {t.newFertilizerItemRequest}
                  </Text>
                  <Text className={mutedText}>
                    {currentUser?.name || t.guest} - {activeReg?.regNo || t.noRegistration}
                  </Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className={`${labelText} mb-2`}>
                  {t.requestType}
                </Text>
                <View className="flex-row gap-2.5">
                  {[
                    { key: "fertilizer", label: t.fertilizer, icon: "leaf-outline", activeClass: "border-[#16a34a] bg-[#dcfce7]", inactiveClass: "border-[#e0e0e0] bg-[#f5f5f5] dark:border-[#333333] dark:bg-[#1e1e1e]", iconColor: "#16a34a" },
                    { key: "item", label: t.item, icon: "cube-outline", activeClass: "border-[#d97706] bg-[#fef3c7]", inactiveClass: "border-[#e0e0e0] bg-[#f5f5f5] dark:border-[#333333] dark:bg-[#1e1e1e]", iconColor: "#d97706" },
                  ].map((cat) => {
                    const isActive = category === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        onPress={() => setCategory(cat.key)}
                        className={`flex-1 items-center gap-1.5 rounded-xl border-2 px-2.5 py-3 ${isActive ? cat.activeClass : cat.inactiveClass}`}
                      >
                        <View className={`h-9 w-9 items-center justify-center rounded-full ${isActive ? "bg-white/40" : "bg-[#e0e0e0]/30 dark:bg-[#333333]/30"}`}>
                          <Ionicons
                            name={cat.icon}
                            size={19}
                            color={isActive ? cat.iconColor : colors.textMuted}
                          />
                        </View>
                        <Text className={`text-center text-[11px] ${isActive ? "font-bold" : "font-medium"} ${cat.key === "fertilizer" && isActive ? "text-[#16a34a]" : ""}${cat.key === "item" && isActive ? "text-[#d97706]" : ""}${!isActive ? " text-[#212121] dark:text-white" : ""}`}>
                          {cat.label}
                        </Text>
                        {isActive && (
                          <Ionicons name="checkmark-circle" size={15} color={cat.iconColor} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="mb-4">
                <Text className={`${labelText} mb-1.5`}>
                  {t.month}
                </Text>
                <View className="flex-row items-center gap-2 rounded-[10px] border border-[#e0e0e0] bg-[#f5f5f5] px-3.5 py-3 dark:border-[#333333] dark:bg-[#1e1e1e]">
                  <Ionicons name="calendar-outline" size={19} color={colors.primary} />
                  <Text className="text-[15px] font-semibold text-[#212121] dark:text-white">{currentMonth}</Text>
                </View>
              </View>

              <Picker
                label={category === "fertilizer" ? t.fertilizerType : t.itemType}
                value={selectedType}
                options={currentTypes}
                onSelect={setSelectedType}
                placeholder={
                  supplyTypesLoading
                    ? t.loadingTypes
                    : currentTypes.length === 0
                      ? t.noTypesAvailable
                      : category === "fertilizer"
                        ? t.selectFertilizerType
                        : t.selectItemType
                }
              />

              {category === "fertilizer" && (
                <View className="mb-4">
                  <Text className={`${labelText} mb-2`}>
                    {t.unit}
                  </Text>
                  <View className="flex-row gap-2.5">
                    {[
                      { key: "kg", label: t.unitKg },
                      { key: "Nos", label: t.unitNos },
                    ].map((u) => {
                      const isActive = unit === u.key;
                      return (
                        <TouchableOpacity
                          key={u.key}
                          onPress={() => setUnit(u.key)}
                          className={`flex-1 items-center rounded-[10px] border-2 py-2.5 ${isActive ? "border-[#2e7d32] bg-[#2e7d32]/15 dark:border-[#66bb6a] dark:bg-[#66bb6a]/15" : "border-[#e0e0e0] bg-[#f5f5f5] dark:border-[#333333] dark:bg-[#1e1e1e]"}`}
                        >
                          <Text className={`text-[13px] ${isActive ? "font-bold text-[#2e7d32] dark:text-[#66bb6a]" : "font-medium text-[#212121] dark:text-white"}`}>
                            {u.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <Input
                label={quantityLabel}
                value={quantity}
                onChangeText={setQuantity}
                placeholder={quantityPlaceholder}
                keyboardType="numeric"
              />

              <View className="mb-5 flex-row items-start gap-2 rounded-[10px] bg-[#dbeafe] p-3">
                <Ionicons name="information-circle" size={19} color="#2563eb" />
                <Text className="flex-1 text-[11px] text-[#1e40af]">
                  {category === "fertilizer" ? t.fertilizerInfoNote : t.itemInfoNote}
                </Text>
              </View>

              <Button
                title={t.submitRequest}
                onPress={handleRequest}
                loading={loading}
                icon="send-outline"
              />
            </Card>

            {combinedHistory.length === 0 ? (
              <Card>
                <EmptyState
                  icon="leaf-outline"
                  message={t.noSupplyRequestsYet}
                  description={t.supplyRequestHistoryWillAppear}
                />
              </Card>
            ) : (
              <Card className="mb-4 overflow-hidden p-0">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                >
                  <View className="min-w-[588px]">
                    <View className="flex-row border-b-2 border-[#2e7d32] bg-[#2e7d32]/10 px-3.5 py-3 dark:border-[#66bb6a] dark:bg-[#66bb6a]/10">
                      <Text className="w-[150px] text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
                        {t.colDate?.charAt(0).toUpperCase() + t.colDate?.slice(1).toLowerCase() || "Date"}
                      </Text>
                      <Text className="w-[80px] text-center text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
                        {t.colCategory?.charAt(0).toUpperCase() + t.colCategory?.slice(1).toLowerCase() || "Category"}
                      </Text>
                      <Text className="w-[110px] text-center text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
                        {t.colType?.charAt(0).toUpperCase() + t.colType?.slice(1).toLowerCase() || "Type"}
                      </Text>
                      <Text className="w-[80px] text-center text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
                        {t.colQty?.charAt(0).toUpperCase() + t.colQty?.slice(1).toLowerCase() || "Qty"}
                      </Text>
                      <Text className="w-[90px] text-center text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
                        {t.status?.charAt(0).toUpperCase() + t.status?.slice(1).toLowerCase() || "Status"}
                      </Text>
                      <Text className="w-[50px] text-center text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
                        {(t.action ?? "Action")?.charAt(0).toUpperCase() + (t.action ?? "Action")?.slice(1).toLowerCase()}
                      </Text>
                    </View>

                    {combinedHistory.map((req, i) => (
                      <View
                        key={`${req.category}-${req.id || i}`}
                        className={`flex-row items-center px-3.5 py-3.5 ${i < combinedHistory.length - 1 ? "border-b border-[#e0e0e0] dark:border-[#333333]" : ""} ${i % 2 === 0 ? "bg-transparent" : "bg-[#f5f5f5]/40 dark:bg-[#1e1e1e]/40"}`}
                      >
                        <Text numberOfLines={1} className="w-[150px] text-[11px] font-medium text-[#212121] dark:text-white">
                          {formatDate(req.createdAt)}
                        </Text>
                        <View className="w-[80px] items-center">
                          <View className={`rounded-lg px-1.5 py-0.5 ${req.category === "Fertilizer" ? "bg-[#dcfce7]" : "bg-[#fef3c7]"}`}>
                            <Text className={`text-[10px] font-semibold ${req.category === "Fertilizer" ? "text-[#16a34a]" : "text-[#d97706]"}`}>
                              {req.category === "Fertilizer" ? t.fertilizer : t.item}
                            </Text>
                          </View>
                        </View>
                        <Text numberOfLines={1} className="w-[110px] text-center text-[11px] text-[#757575] dark:text-[#b0b0b0]">
                          {req.displayType}
                        </Text>
                        <Text numberOfLines={1} className="w-[80px] text-center text-[11px] font-semibold text-[#212121] dark:text-white">
                          {formatQty(
                            req.quantity,
                            req.category === "Other Item" ? "units" : (req.unit ?? "kg")
                          )}
                        </Text>
                        <View className="w-[90px] items-center">
                          <StatusBadge status={req.status || "pending"} size="small" />
                        </View>
                        <View className="w-[50px] items-center">
                          {(req.status === "pending" || req.status === "Pending") && (
                            <TouchableOpacity onPress={() => setDeleteConfirm(req)}>
                              <Ionicons name="trash-outline" size={19} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}

                    <View className="flex-row items-center justify-between border-t border-[#e0e0e0] bg-[#f5f5f5] px-3.5 py-3 dark:border-[#333333] dark:bg-[#1e1e1e]">
                      <Text className="text-[13px] text-[#757575] dark:text-[#b0b0b0]">
                        {t.total}: {combinedHistory.length}
                      </Text>
                      <Text className="text-[11px] text-[#757575] dark:text-[#b0b0b0]">
                        {fertilizerRequests?.length || 0} {t.fertilizerLower} - {itemRequests?.length || 0} {t.itemsLower}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </Card>
            )}
          </View>
        </ScrollView>
      </KeyboardView>

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="fertilizerItemRequest" />

      <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
        <View className="flex-1 justify-center bg-black/60 p-6">
          <View className="rounded-2xl bg-[#f5f1ea] p-6 dark:bg-[#121212]">
            <Text className={titleText}>
              {t.confirm ?? "Confirm"}
            </Text>
            <Text className={`${mutedText} mb-6 mt-2`}>
              {t.deleteConfirmMessage ?? "Are you sure you want to delete this request?"}
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDeleteConfirm(null)}
                className="flex-1 items-center rounded-[10px] border border-[#e0e0e0] p-3 dark:border-[#333333]"
              >
                <Text className="font-semibold text-[#212121] dark:text-white">{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 items-center rounded-[10px] bg-[#ef4444] p-3"
              >
                <Text className="font-semibold text-white">
                  {deleteLoading ? "..." : (t.delete ?? "Delete")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
