// fertilizerItem-request.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, EmptyState, Input, Picker, ScreenHeader, StatusBadge, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { fertilizerApi, itemApi, tokenStorage } from "../../utils/api";

export default function FertilizerItemRequestScreen() {  // Changed component name
  const { colors, fs, t } = useTheme();
  const {
    fertilizerRequests, addFertilizerRequest,
    itemRequests, addItemRequest,
    currentUser, activeReg,
  } = useApp();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState("fertilizer"); // "fertilizer" | "item"
  const [selectedType, setSelectedType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const [fertilizerTypes, setFertilizerTypes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  // Load both fertilizer and item types on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (!token) {
          console.log("No token found");
          if (mounted) setTypesLoading(false);
          return;
        }

        const [fResult, iResult] = await Promise.allSettled([
          fertilizerApi.types(token),
          itemApi.types(token),
        ]);

        if (mounted) {
          if (fResult.status === "fulfilled" && Array.isArray(fResult.value)) {
            setFertilizerTypes(fResult.value.map((tp) => ({ value: tp, label: tp })));
          } else if (fResult.status === "rejected") {
            console.log("Failed to fetch fertilizer types:", fResult.reason);
          }

          if (iResult.status === "fulfilled" && Array.isArray(iResult.value)) {
            setItemTypes(iResult.value.map((tp) => ({ value: tp, label: tp })));
          } else if (iResult.status === "rejected") {
            console.log("Failed to fetch item types:", iResult.reason);
          }
        }
      } catch (error) {
        console.log("Error loading types:", error);
      } finally {
        if (mounted) setTypesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Reset selected type when category changes
  useEffect(() => {
    setSelectedType("");
    setQuantity("");
  }, [category]);

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const currentTypes = category === "fertilizer" ? fertilizerTypes : itemTypes;
  const quantityUnit = category === "fertilizer" ? t.unitKg : t.unitUnits;
  const quantityPlaceholder = category === "fertilizer"
    ? t.enterQuantityKg
    : t.enterQuantityUnits;

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
        });
      } else {
        await addItemRequest({
          month: currentMonth,
          itemType: selectedType,
          quantity: quantityNum,
        });
      }
      setSelectedType("");
      setQuantity("");
      showToast(t.successRequest);
    } catch (error) {
      console.log("Request error:", error);
      showToast(error?.message || t.failedToSubmitRequest, "error");
    } finally {
      setLoading(false);
    }
  };

  // Combined history: merge fertilizer + item requests, sorted by date
  const combinedHistory = useMemo(() => {
    const fReqs = (fertilizerRequests || []).map((r) => ({
      ...r,
      category: "Fertilizer",
      displayType: r.fertType || r.fertilizerType || "-",
    }));
    const iReqs = (itemRequests || []).map((r) => ({
      ...r,
      category: "Item",
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

  const formatQty = (qty, cat) => {
    if (!qty && qty !== 0) return "-";
    try {
      const n = parseFloat(qty).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
      return `${n} ${cat === "Fertilizer" ? t.unitKg : t.unitUnits}`;
    } catch { return "-"; }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t.fertilizerItemRequest}
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
          {/* Request Form */}
          <Card style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: category === "fertilizer" ? "#dcfce7" : "#fef3c7",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontSize: 24 }}>{category === "fertilizer" ? "🌿" : "📦"}</Text>
              </View>
              <View>
                <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text }}>
                  {t.newFertilizerItemRequest}
                </Text>
                <Text style={{ fontSize: fs.xs, color: colors.textSecondary }}>
                  {currentUser?.name || t.guest} · {activeReg?.regNo || t.noRegistration}
                </Text>
              </View>
            </View>

            {/* Category Selector */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 8 }}>
                {t.requestType}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { key: "fertilizer", label: t.fertilizer, icon: "leaf-outline", color: "#16a34a", bg: "#dcfce7" },
                  { key: "item",       label: t.item,       icon: "cube-outline", color: "#d97706", bg: "#fef3c7" },
                ].map((cat) => {
                  const isActive = category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setCategory(cat.key)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isActive ? cat.color : colors.border,
                        backgroundColor: isActive ? cat.bg : colors.surface,
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: isActive ? cat.color + "20" : colors.border + "30",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Ionicons
                          name={cat.icon}
                          size={fs.lg}
                          color={isActive ? cat.color : colors.textMuted}
                        />
                      </View>
                      <Text style={{
                        color: isActive ? cat.color : colors.text,
                        fontSize: fs.xs,
                        fontWeight: isActive ? "700" : "500",
                        textAlign: "center",
                      }}>
                        {cat.label}
                      </Text>
                      {isActive && (
                        <Ionicons name="checkmark-circle" size={fs.base} color={cat.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Month display */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>
                {t.month}
              </Text>
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

            {/* Type picker */}
            <Picker
              label={category === "fertilizer" ? t.fertilizerType : t.itemType}
              value={selectedType}
              options={currentTypes}
              onSelect={setSelectedType}
              placeholder={
                typesLoading
                  ? t.loadingTypes
                  : currentTypes.length === 0
                    ? t.noTypesAvailable
                    : category === "fertilizer"
                      ? t.selectFertilizerType
                      : t.selectItemType
              }
            />

            {/* Quantity */}
            <Input
              label={`${t.quantity} (${quantityUnit})`}
              value={quantity}
              onChangeText={setQuantity}
              placeholder={quantityPlaceholder}
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
              <Ionicons name="information-circle" size={fs.lg} color="#2563eb" />
              <Text style={{ color: "#1e40af", fontSize: fs.xs, flex: 1 }}>
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

          {/* Combined History */}
          <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            {t.requestHistory}{combinedHistory.length > 0 ? ` (${combinedHistory.length})` : ""}
          </Text>

          {combinedHistory.length === 0 ? (
            <Card>
              <EmptyState
                icon="leaf-outline"
                message={t.noSupplyRequestsYet}
                description={t.supplyRequestHistoryWillAppear}
              />
            </Card>
          ) : (
            <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
              {/* Table Header */}
              <View style={{
                flexDirection: "row",
                backgroundColor: colors.primary + "10",
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderBottomWidth: 2,
                borderBottomColor: colors.primary,
              }}>
                <Text style={{ flex: 1.8, color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>{t.colDate}</Text>
                <Text style={{ flex: 1, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>{t.colCategory}</Text>
                <Text style={{ flex: 1.5, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>{t.colType}</Text>
                <Text style={{ flex: 1.2, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>{t.colQty}</Text>
                <Text style={{ flex: 1.2, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>{t.status}</Text>
              </View>

              {/* Table Rows */}
              {combinedHistory.map((req, i) => (
                <View
                  key={`${req.category}-${req.id || i}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    borderBottomWidth: i < combinedHistory.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "40",
                  }}
                >
                  <Text numberOfLines={1} style={{ flex: 1.8, color: colors.text, fontSize: fs.xs, fontWeight: "500" }}>
                    {formatDate(req.createdAt)}
                  </Text>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <View style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                      backgroundColor: req.category === "Fertilizer" ? "#dcfce7" : "#fef3c7",
                    }}>
                      <Text style={{
                        fontSize: fs.xs - 1,
                        fontWeight: "700",
                        color: req.category === "Fertilizer" ? "#16a34a" : "#d97706",
                      }}>
                        {req.category === "Fertilizer" ? t.fertilizer : t.item}
                      </Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={{ flex: 1.5, color: colors.textSecondary, fontSize: fs.xs, textAlign: "center" }}>
                    {req.displayType}
                  </Text>
                  <Text numberOfLines={1} style={{ flex: 1.2, color: colors.text, fontSize: fs.xs, fontWeight: "600", textAlign: "center" }}>
                    {formatQty(req.quantity, req.category)}
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
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: colors.surface,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: fs.sm }}>
                  {t.total}: {combinedHistory.length}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fs.xs }}>
                  {fertilizerRequests?.length || 0} {t.fertilizerLower} · {itemRequests?.length || 0} {t.itemsLower}
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
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="fertilizerItemRequest" />
    </SafeAreaView>
  );
}