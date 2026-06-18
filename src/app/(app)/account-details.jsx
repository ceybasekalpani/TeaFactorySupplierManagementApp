import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import { Button, Card, Input, Picker, ScreenHeader, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const BANK_OPTIONS = [
  { value: "Bank of Ceylon", label: "Bank of Ceylon" },
  { value: "Peoples Bank", label: "Peoples Bank" },
  { value: "Commercial Bank", label: "Commercial Bank of Ceylon" },
  { value: "Sampath Bank", label: "Sampath Bank" },
  { value: "HNB", label: "Hatton National Bank" },
  { value: "NSB", label: "National Savings Bank" },
  { value: "Seylan Bank", label: "Seylan Bank" },
];

export default function AccountDetailsScreen() {
  const { t } = useTheme();
  const { currentUser, updateProfile } = useApp();
  const router = useRouter();

  const [bankName, setBankName] = useState(currentUser?.bankName || "");
  const [accountNumber, setAccountNumber] = useState(currentUser?.accountNumber || "");
  const [accountHolder, setAccountHolder] = useState(currentUser?.accountHolder || "");
  const [branch, setBranch] = useState(currentUser?.branch || "");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [disabled, setDisabled] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const handleSave = async () => {
    if (!bankName || !accountNumber || !accountHolder || !branch) {
      showToast(t.fillAllFields, "error");
      return;
    }

    if (accountNumber.length < 8 || accountNumber.length > 16) {
      showToast("Account number must be 8-16 digits", "error");
      return;
    }

    setDisabled(true);
    setLoading(true);

    try {
      await updateProfile({ bankName, accountNumber, accountHolder, branch });
      showToast(t.saveSuccess || "Account details updated successfully!");
    } catch (_) {
      showToast(t.saveError || "Failed to update account details. Please try again.", "error");
    } finally {
      setLoading(false);

      setTimeout(() => {
        setDisabled(false);
      }, 3000);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <ScreenHeader title={t.accountDetails} onBack={() => router.back()} />

      <KeyboardView>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="px-4 pt-4 pb-[60px]">
            <View className="mb-4 flex-row items-center gap-3 rounded-[14px] bg-[#2e7d32]/15 p-4 dark:bg-[#66bb6a]/15">
              <Text className="text-[32px]">{"\uD83C\uDFE6"}</Text>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
                  {currentUser?.bankName || t.noData || "No bank set"}
                </Text>
                <Text className="text-[11px] text-[#757575] dark:text-[#b0b0b0]">
                  {t.accountNumber}: {currentUser?.accountNumber ? `****${currentUser.accountNumber.slice(-4)}` : "-"}
                </Text>
              </View>
            </View>

            <Card>
              <Text className="mb-4 text-[17px] font-bold text-[#212121] dark:text-white">
                {t.accountDetails}
              </Text>

              <Picker
                label={t.bankName}
                value={bankName}
                options={BANK_OPTIONS}
                onSelect={setBankName}
                placeholder={`${t.selectBank || "Select Bank"}`}
              />

              <Input
                label={t.accountNumber}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder={t.accountNumber}
                keyboardType="number-pad"
              />

              <Input
                label={t.accountHolder}
                value={accountHolder}
                onChangeText={setAccountHolder}
                placeholder={t.accountHolder}
              />

              <Input
                label={t.branch}
                value={branch}
                onChangeText={setBranch}
                placeholder={t.branch}
              />

              {!disabled && (
                <Button
                  title={t.save}
                  onPress={handleSave}
                  loading={loading}
                  icon="checkmark-circle"
                  disabled={true}
                />
              )}
            </Card>
          </View>
        </ScrollView>
      </KeyboardView>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </SafeAreaView>
  );
}
