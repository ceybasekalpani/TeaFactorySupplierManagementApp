import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Picker } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

export default function SelectAccountScreen() {
  const { colors, fs, t } = useTheme();
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
      setError("Please select a registration number");
      return;
    }
    setLoading(true);
    try {
      await login(selectedReg);
      router.replace("/(app)/home");
    } catch (err) {
      setError(err.message || "Failed to load account. Please try again.");
    } finally {
      setLoading(false);
    }
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
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center", justifyContent: "center",
              marginBottom: 12,
            }}>
              <Ionicons name="person" size={36} color="#fff" />
            </View>
            <Text style={{ fontSize: fs.md, color: "rgba(255,255,255,0.8)" }}>
              {t.welcome}
            </Text>
            <Text style={{ fontSize: fs["2xl"], fontWeight: "800", color: "#fff", marginTop: 4 }}>
              {currentUser?.name ?? ""}
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

            {selectedReg?.route ? (
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 8,
                backgroundColor: colors.surface, borderRadius: 10,
                padding: 12, marginBottom: 16,
              }}>
                <Ionicons name="map-outline" size={fs.md} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: fs.sm }}>
                  {selectedReg.route}
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Ionicons name="alert-circle" size={fs.base} color={colors.error} />
                <Text style={{ color: colors.error, fontSize: fs.sm }}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={loading ? "Loading..." : t.open}
              onPress={handleOpen}
              icon="checkmark-circle-outline"
              disabled={loading}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
