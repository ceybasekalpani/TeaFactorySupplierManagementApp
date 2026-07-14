import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import { Button, Card, Picker } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

export default function SelectAccountScreen() {
  const { t } = useTheme();
  const { currentUser, registrations, login } = useApp();
  const router = useRouter();

  const [selectedRegNo, setSelectedRegNo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const regOptions = registrations.map((r) => ({
    value: r.regNo ?? r.regNo,
    label: String(r.regNo),
  }));

  const selectedReg = registrations.find((r) => String(r.regNo) === String(selectedRegNo));

  const handleRegSelect = (val) => {
    setSelectedRegNo(val);
    setError("");
  };

  const handleOpen = async () => {
    if (!selectedReg) {
      setError(t.selectRegNoError);
      return;
    }
    setLoading(true);
    try {
      await login(selectedReg);
      router.replace("/(app)/home");
    } catch (err) {
      setError(err.message || t.loadAccountFailedRetry);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <KeyboardView>
        <ScrollView className="flex-1">
          <View className="min-h-full p-6">
            <View className="mb-6 items-center rounded-[20px] bg-[#2e7d32] p-6 dark:bg-[#66bb6a]">
              <View className="mb-3 h-[72px] w-[72px] items-center justify-center rounded-full bg-white/20">
                <Ionicons name="person" size={36} color="#fff" />
              </View>
              <Text className="text-[17px] text-white/80">
                {t.welcome}
              </Text>
              <Text className="mt-1 text-[26px] font-extrabold text-white">
                {currentUser?.name ?? ""}
              </Text>
            </View>

            <Card>
              <Text className="mb-1 text-[19px] font-bold text-[#212121] dark:text-white">
                {t.selectYourAccount}
              </Text>
              <Text className="mb-5 text-[13px] text-[#757575] dark:text-[#b0b0b0]">
                {t.multipleRegistrationsMessage}
              </Text>

              <Picker
                label={t.selectRegNo}
                value={selectedRegNo}
                options={regOptions}
                onSelect={handleRegSelect}
                placeholder={t.selectRegNo}
              />

              {selectedReg?.route ? (
                <View className="mb-4 flex-row items-center gap-2 rounded-[10px] bg-[#f5f5f5] p-3 dark:bg-[#1e1e1e]">
                  <Ionicons name="map-outline" size={17} color="#2e7d32" />
                  <Text className="text-[13px] text-[#212121] dark:text-white">
                    {selectedReg.route}
                  </Text>
                </View>
              ) : null}

              {error ? (
                <View className="mb-3 flex-row items-center gap-1.5">
                  <Ionicons name="alert-circle" size={15} color="#b71c1c" />
                  <Text className="text-[13px] text-[#b71c1c] dark:text-[#ef5350]">{error}</Text>
                </View>
              ) : null}

              <Button
                title={loading ? t.loadingEllipsis : t.open}
                onPress={handleOpen}
                icon="checkmark-circle-outline"
                disabled={loading}
              />
            </Card>
          </View>
        </ScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}
