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
  const { colors, fs, t } = useTheme();
  const { currentUser, updateProfile } = useApp();
  const router = useRouter();

  const [bankName, setBankName] = useState(currentUser?.bankName || "");
  const [accountNumber, setAccountNumber] = useState(currentUser?.accountNumber || "");
  const [accountHolder, setAccountHolder] = useState(currentUser?.accountHolder || "");
  const [branch, setBranch] = useState(currentUser?.branch || "");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

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
      showToast("Account number must be 8–16 digits", "error");
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ bankName, accountNumber, accountHolder, branch });
      showToast("Account details updated successfully!");
    } catch (_) {
      showToast("Failed to update account details. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t.accountDetails} onBack={() => router.back()} />

      <KeyboardView>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* Current Details */}
        <View style={{
          backgroundColor: colors.primary + "15",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          flexDirection: "row",
          gap: 12,
          alignItems: "center",
        }}>
          <Text style={{ fontSize: 32 }}>🏦</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: fs.base }}>
              {currentUser?.bankName || "No bank set"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: fs.xs }}>
              Acc: {currentUser?.accountNumber ? `****${currentUser.accountNumber.slice(-4)}` : "—"}
            </Text>
          </View>
        </View>

        <Card>
          <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            Bank Details
          </Text>

          <Picker
            label={t.bankName}
            value={bankName}
            options={BANK_OPTIONS}
            onSelect={setBankName}
            placeholder="Select Bank"
          />

          <Input
            label={t.accountNumber}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Enter account number"
            keyboardType="number-pad"
          />

          <Input
            label={t.accountHolder}
            value={accountHolder}
            onChangeText={setAccountHolder}
            placeholder="Name as on bank account"
          />

          <Input
            label={t.branch}
            value={branch}
            onChangeText={setBranch}
            placeholder="e.g. Kandy"
          />

          <Button title={t.save} onPress={handleSave} loading={loading} icon="checkmark-circle" />
        </Card>
        </ScrollView>
      </KeyboardView>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </SafeAreaView>
  );
}
