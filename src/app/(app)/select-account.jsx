import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Picker } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

export default function SelectAccountScreen() {
  const { colors, fs, t } = useTheme();
  const { suppliers, login } = useApp();
  const router = useRouter();
  const { supplierId } = useLocalSearchParams();

  const supplier = suppliers.find((s) => s.id === supplierId);
  const [selectedRegNo, setSelectedRegNo] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [error, setError] = useState("");

  if (!supplier) return null;

  const regOptions = supplier.registrations.map((r) => ({
    value: r.regNo,
    label: r.regNo,
  }));

  const routeOptions = supplier.registrations
    .filter((r) => !selectedRegNo || r.regNo === selectedRegNo)
    .map((r) => ({ value: r.route, label: r.route }));

  const handleRegSelect = (val) => {
    setSelectedRegNo(val);
    // Auto-fill route if only one route for this reg
    const reg = supplier.registrations.find((r) => r.regNo === val);
    if (reg) setSelectedRoute(reg.route);
    setError("");
  };

  const handleOpen = () => {
    if (!selectedRegNo || !selectedRoute) {
      setError("Please select registration number and route");
      return;
    }
    const reg = supplier.registrations.find((r) => r.regNo === selectedRegNo);
    login(supplier, reg);
    router.replace("/(app)/home");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          {/* Top banner */}
          <View style={{
            backgroundColor: colors.primary,
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            alignItems: "center",
          }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}>
              <Ionicons name="person" size={36} color="#fff" />
            </View>
            <Text style={{ fontSize: fs.md, color: "rgba(255,255,255,0.8)" }}>
              {t.welcome}
            </Text>
            <Text style={{ fontSize: fs["2xl"], fontWeight: "800", color: "#fff", marginTop: 4 }}>
              {supplier.name}
            </Text>
          </View>

          <Card>
            <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
              Select Your Account
            </Text>
            <Text style={{ fontSize: fs.sm, color: colors.textSecondary, marginBottom: 20 }}>
              You have multiple registrations. Please select one to continue.
            </Text>

            <Picker
              label={t.selectRegNo}
              value={selectedRegNo}
              options={regOptions}
              onSelect={handleRegSelect}
              placeholder={t.selectRegNo}
            />

            <Picker
              label={t.selectRoute}
              value={selectedRoute}
              options={routeOptions}
              onSelect={setSelectedRoute}
              placeholder={t.selectRoute}
            />

            {error ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Ionicons name="alert-circle" size={fs.base} color={colors.error} />
                <Text style={{ color: colors.error, fontSize: fs.sm }}>{error}</Text>
              </View>
            ) : null}

            <Button title={t.open} onPress={handleOpen} icon="checkmark-circle-outline" />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
