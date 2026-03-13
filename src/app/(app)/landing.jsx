import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform, ScrollView,
  Text, TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

export default function LandingScreen() {
  const { colors, fs, t } = useTheme();
  const { signIn, login, suppliers } = useApp();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const supplier = signIn(username.trim(), password);
    setLoading(false);

    if (!supplier) {
      setError(t.loginError);
      return;
    }

    if (supplier.registrations.length > 1) {
      // Multiple accounts → go to select account page
      router.push({ pathname: "/(auth)/select-account", params: { supplierId: supplier.id } });
    } else {
      // Single account → directly to app
      login(supplier, supplier.registrations[0]);
      router.replace("/(app)/home");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Hero Section */}
          <View style={{
            backgroundColor: colors.primary,
            paddingTop: 60,
            paddingBottom: 80,
            paddingHorizontal: 24,
            alignItems: "center",
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}>
            {/* Logo / Tea leaf illustration */}
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 56 }}>🍃</Text>
            </View>
            <Text style={{
              fontSize: fs["2xl"],
              fontWeight: "800",
              color: "#fff",
              letterSpacing: 0.5,
            }}>
              Tea Factory
            </Text>
            <Text style={{
              fontSize: fs.base,
              color: "rgba(255,255,255,0.75)",
              marginTop: 4,
            }}>
              Supplier Management Portal
            </Text>
          </View>

          {/* Sign In Card */}
          <View style={{ flex: 1, padding: 24, marginTop: -30 }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 8,
            }}>
              <Text style={{ fontSize: fs.xl, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
                Welcome Back 👋
              </Text>
              <Text style={{ fontSize: fs.sm, color: colors.textSecondary, marginBottom: 24 }}>
                Sign in to your supplier account
              </Text>

              {/* Username */}
              <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>
                {t.username}
              </Text>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.inputBg,
                borderWidth: 1.5,
                borderColor: error ? colors.error : colors.border,
                borderRadius: 10,
                paddingHorizontal: 14,
                marginBottom: 12,
              }}>
                <Ionicons name="person-outline" size={fs.lg} color={colors.textMuted} />
                <Input
                  value={username}
                  onChangeText={setUsername}
                  placeholder="e.g. kamal.perera"
                  style={{ flex: 1, borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 8, marginBottom: 0 }}
                />
              </View>

              {/* Password */}
              <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>
                {t.password}
              </Text>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.inputBg,
                borderWidth: 1.5,
                borderColor: error ? colors.error : colors.border,
                borderRadius: 10,
                paddingHorizontal: 14,
                marginBottom: 8,
              }}>
                <Ionicons name="lock-closed-outline" size={fs.lg} color={colors.textMuted} />
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 8, marginBottom: 0 }}
                />
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={fs.lg} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Ionicons name="alert-circle" size={fs.base} color={colors.error} />
                  <Text style={{ color: colors.error, fontSize: fs.sm }}>{error}</Text>
                </View>
              ) : null}

              <Button
                title={t.signIn}
                onPress={handleSignIn}
                loading={loading}
                style={{ marginTop: 8 }}
                icon="log-in-outline"
              />
            </View>

            {/* Demo hint */}
            <View style={{
              marginTop: 24,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: colors.accent,
            }}>
              <Text style={{ color: colors.text, fontSize: fs.sm, fontWeight: "700", marginBottom: 6 }}>
                🔑 Demo Credentials
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fs.xs }}>
                Multiple accounts: kamal.perera / 1234
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fs.xs }}>
                Single account: saman.silva / 1234
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
