import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, Input, ScreenHeader, Toast } from "../../components/ui";
import { useTheme } from "../../hooks/useTheme";

const LAND_INFO_KEY = "landInfo";

export default function LandInfoScreen() {
  const { colors, fs, t } = useTheme(); // Added 't' for translations
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [landName, setLandName] = useState("");
  const [acres, setAcres] = useState("");
  const [rood, setRood] = useState("");
  const [perches, setPerches] = useState("");
  const [purchaseInfo, setPurchaseInfo] = useState("");
  const [maxLeaves, setMaxLeaves] = useState("");
  const [minLeaves, setMinLeaves] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const acresRef = useRef(null);
  const roodRef = useRef(null);
  const perchesRef = useRef(null);
  const acresTimerRef = useRef(null);
  const roodTimerRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(LAND_INFO_KEY)
      .then((raw) => {
        if (raw) {
          const data = JSON.parse(raw);
          setLandName(data.landName || "");
          setAcres(data.acres || "");
          setRood(data.rood || "");
          setPerches(data.perches || "");
          setPurchaseInfo(data.purchaseInfo || "");
          setMaxLeaves(data.maxLeaves || "");
          setMinLeaves(data.minLeaves || "");
        }
        setDataLoaded(true);
      })
      .catch(() => setDataLoaded(true));
  }, []);

  useEffect(() => {
    return () => {
      if (acresTimerRef.current) clearTimeout(acresTimerRef.current);
      if (roodTimerRef.current) clearTimeout(roodTimerRef.current);
    };
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const handleSave = async () => {
    if (!landName.trim()) {
      showToast(t.errorLandName, "error");
      return;
    }
    if (maxLeaves && minLeaves) {
      const maxNum = parseFloat(maxLeaves);
      const minNum = parseFloat(minLeaves);
      if (!isNaN(maxNum) && !isNaN(minNum) && minNum > maxNum) {
        showToast(t.errorMinMax, "error");
        return;
      }
    }
    setLoading(true);
    try {
      await AsyncStorage.setItem(LAND_INFO_KEY, JSON.stringify({
        landName: landName.trim(),
        acres: acres.trim(),
        rood: rood.trim(),
        perches: perches.trim(),
        purchaseInfo: purchaseInfo.trim(),
        maxLeaves: maxLeaves.trim(),
        minLeaves: minLeaves.trim(),
      }));
      showToast(t.saveSuccess);
    } catch {
      showToast(t.saveError, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAcresChange = (val) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(0, 4);
    setAcres(cleaned);
    if (acresTimerRef.current) clearTimeout(acresTimerRef.current);
    if (cleaned.length > 0) {
      acresTimerRef.current = setTimeout(() => {
        roodRef.current?.focus();
      }, 500);
    }
  };

  const handleRoodChange = (val) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(0, 4);
    setRood(cleaned);
    if (roodTimerRef.current) clearTimeout(roodTimerRef.current);
    if (cleaned.length > 0) {
      roodTimerRef.current = setTimeout(() => {
        perchesRef.current?.focus();
      }, 500);
    }
  };

  const handlePerchesChange = (val) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(0, 4);
    setPerches(cleaned);
  };

  const hasSummary = dataLoaded && landName;
  const hasSizeData = acres || rood || perches;

  // Shared style for the raw TextInput boxes
  const sizeInputStyle = {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fs.base,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: "center",
  };

  const sizeLabelStyle = {
    color: colors.textSecondary,
    fontSize: fs.xs,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t.landInfo}
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
          {/* Summary card */}
          {hasSummary && (
            <Card style={{
              marginBottom: 16,
              backgroundColor: colors.primary + "10",
              borderColor: colors.primary + "30",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: colors.primary + "20",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="map" size={fs.lg} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: fs.base }}>
                    {landName}
                  </Text>
                  {hasSizeData ? (
                    <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2 }}>
                      {acres || "0"} Ac  {rood || "0"} Ro  {perches || "0"} Pe
                    </Text>
                  ) : null}
                  {(maxLeaves || minLeaves) ? (
                    <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2 }}>
                      {t.dailySupplyRange}: {minLeaves || "—"} – {maxLeaves || "—"} {t.kg}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          )}

          {/* Land Details Form */}
          <Card style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
              {t.landDetails}
            </Text>

            <Input
              label={t.landNameLabel}
              value={landName}
              onChangeText={setLandName}
              placeholder={t.landNamePlaceholder}
            />

            {/* Size: Acres / Rood / Perches */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{
                color: colors.textSecondary,
                fontSize: fs.sm,
                fontWeight: "600",
                marginBottom: 10,
              }}>
                {t.sizeOfLand}
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                {/* Acres */}
                <View style={{ flex: 1 }}>
                  <TextInput
                    ref={acresRef}
                    style={sizeInputStyle}
                    value={acres}
                    onChangeText={handleAcresChange}
                    placeholder={t.acres}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={4}
                    returnKeyType="next"
                    onSubmitEditing={() => roodRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Rood */}
                <View style={{ flex: 1 }}>
                  <TextInput
                    ref={roodRef}
                    style={sizeInputStyle}
                    value={rood}
                    onChangeText={handleRoodChange}
                    placeholder={t.rood}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={4}
                    returnKeyType="next"
                    onSubmitEditing={() => perchesRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Perches */}
                <View style={{ flex: 1 }}>
                  <TextInput
                    ref={perchesRef}
                    style={sizeInputStyle}
                    value={perches}
                    onChangeText={handlePerchesChange}
                    placeholder={t.perches}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={4}
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Size preview badge */}
              {hasSizeData && (
                <View style={{
                  marginTop: 10,
                  backgroundColor: colors.primary + "10",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <Ionicons name="resize-outline" size={fs.sm} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: fs.xs, fontWeight: "600" }}>
                    {acres || "0"} {t.acres}  {rood || "0"} {t.rood}  {perches || "0"} {t.perches}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Leaf Capacity */}
          <Card style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
              {t.leafCapacity}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginBottom: 16 }}>
              {t.leafCapacityDesc}
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label={t.minLeaves}
                  value={minLeaves}
                  onChangeText={setMinLeaves}
                  placeholder="e.g. 50"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={t.maxLeaves}
                  value={maxLeaves}
                  onChangeText={setMaxLeaves}
                  placeholder="e.g. 200"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {(minLeaves || maxLeaves) && (
              <View style={{
                backgroundColor: "#dbeafe",
                borderRadius: 10,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}>
                <Ionicons name="leaf-outline" size={fs.lg} color="#2563eb" />
                <Text style={{ color: "#1e40af", fontSize: fs.xs, flex: 1 }}>
                  {t.dailySupplyRange}: {minLeaves || "—"} – {maxLeaves || "—"} {t.kg}
                </Text>
              </View>
            )}
          </Card>

          <Button
            title={t.saveLandInfo}
            onPress={handleSave}
            loading={loading}
            icon="save-outline"
          />
        </ScrollView>
      </KeyboardView>

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="landInfo" />
    </SafeAreaView>
  );
}