import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import SidebarMenu from "../../components/SidebarMenu";
import { Button, Card, Input, ScreenHeader, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { buildLandInfoSchema } from "../../schemas/landInfoSchema";

const LAND_INFO_KEY = "landInfo";

export default function LandInfoScreen() {
  const { colors, fs, t } = useTheme();
  const router = useRouter();
  const { currentUser, updateLandInfo } = useApp();

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

        // Database values (Land_Acre/Rood/Perch) take precedence over the local draft.
        if (currentUser?.landAcre != null) setAcres(String(currentUser.landAcre));
        if (currentUser?.landRood != null) setRood(String(currentUser.landRood));
        if (currentUser?.landPerch != null) setPerches(String(currentUser.landPerch));

        setDataLoaded(true);
      })
      .catch(() => setDataLoaded(true));
  }, [currentUser?.landAcre, currentUser?.landRood, currentUser?.landPerch]);

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
    const validation = buildLandInfoSchema(t).safeParse({ landName, maxLeaves, minLeaves });
    if (!validation.success) {
      showToast(validation.error.issues[0].message, "error");
      return;
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

      await updateLandInfo(
        acres.trim() === "" ? null : Number(acres),
        rood.trim() === "" ? null : Number(rood),
        perches.trim() === "" ? null : Number(perches)
      );

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

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <ScreenHeader
        title={t.landInfo}
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
        >
          <View className="px-4 pt-4 pb-[60px]">
            {hasSummary && (
              <Card className="mb-4 border-[#2e7d32]/30 bg-[#2e7d32]/10 dark:border-[#66bb6a]/30 dark:bg-[#66bb6a]/10">
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-[#2e7d32]/20 dark:bg-[#66bb6a]/20">
                    <Ionicons name="map" size={fs.lg} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
                      {landName}
                    </Text>
                    {hasSizeData ? (
                      <Text className="mt-0.5 text-[11px] text-[#757575] dark:text-[#b0b0b0]">
                        {acres || "0"} Ac  {rood || "0"} Ro  {perches || "0"} Pe
                      </Text>
                    ) : null}
                    {(maxLeaves || minLeaves) ? (
                      <Text className="mt-0.5 text-[11px] text-[#757575] dark:text-[#b0b0b0]">
                        {t.dailySupplyRange}: {minLeaves || "-"} - {maxLeaves || "-"} {t.kg}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Card>
            )}

            <Card className="mb-5">
              <Text className="mb-4 text-[17px] font-bold text-[#212121] dark:text-white">
                {t.landDetails}
              </Text>

              <Input
                label={t.landNameLabel}
                value={landName}
                onChangeText={setLandName}
                placeholder={t.landNamePlaceholder}
              />

              <View className="mb-3">
                <Text className="mb-2.5 text-[13px] font-semibold text-[#757575] dark:text-[#b0b0b0]">
                  {t.sizeOfLand}
                </Text>

                <View className="flex-row gap-2.5">
                  <View className="flex-1">
                    <TextInput
                      ref={acresRef}
                      className="rounded-[10px] border-[1.5px] border-[#e0e0e0] bg-[#f5f5f5] px-3 py-3 text-center text-[15px] text-[#212121] dark:border-[#333333] dark:bg-[#1e1e1e] dark:text-white"
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

                  <View className="flex-1">
                    <TextInput
                      ref={roodRef}
                      className="rounded-[10px] border-[1.5px] border-[#e0e0e0] bg-[#f5f5f5] px-3 py-3 text-center text-[15px] text-[#212121] dark:border-[#333333] dark:bg-[#1e1e1e] dark:text-white"
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

                  <View className="flex-1">
                    <TextInput
                      ref={perchesRef}
                      className="rounded-[10px] border-[1.5px] border-[#e0e0e0] bg-[#f5f5f5] px-3 py-3 text-center text-[15px] text-[#212121] dark:border-[#333333] dark:bg-[#1e1e1e] dark:text-white"
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

                {hasSizeData && (
                  <View className="mt-2.5 flex-row items-center gap-1.5 rounded-lg bg-[#2e7d32]/10 px-3 py-2 dark:bg-[#66bb6a]/10">
                    <Ionicons name="resize-outline" size={fs.sm} color={colors.primary} />
                    <Text className="text-[11px] font-semibold text-[#2e7d32] dark:text-[#66bb6a]">
                      {acres || "0"} {t.acres}  {rood || "0"} {t.rood}  {perches || "0"} {t.perches}
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            <Card className="mb-5">
              <Text className="mb-1 text-[17px] font-bold text-[#212121] dark:text-white">
                {t.leafCapacity}
              </Text>
              <Text className="mb-4 text-[11px] text-[#757575] dark:text-[#b0b0b0]">
                {t.leafCapacityDesc}
              </Text>

              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Input
                    label={t.minLeaves}
                    value={minLeaves}
                    onChangeText={setMinLeaves}
                    placeholder="e.g. 50"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
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
                <View className="mt-1 flex-row items-center gap-2 rounded-[10px] bg-[#dbeafe] p-3">
                  <Ionicons name="leaf-outline" size={fs.lg} color="#2563eb" />
                  <Text className="flex-1 text-[11px] text-[#1e40af]">
                    {t.dailySupplyRange}: {minLeaves || "-"} - {maxLeaves || "-"} {t.kg}
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
          </View>
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
