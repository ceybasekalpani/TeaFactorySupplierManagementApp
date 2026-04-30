import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

function Field({ icon, placeholder, value, onChangeText, secureTextEntry, right, hasError, keyboardType }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: hasError ? colors.error : colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 52,
      gap: 10,
    }}>
      <Ionicons name={icon} size={fs.lg} color={hasError ? colors.error : colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={{
          flex: 1,
          fontSize: fs.base,
          color: colors.text,
          paddingVertical: 0,
        }}
      />
      {right}
    </View>
  );
}

export default function LandingScreen() {
  const { colors, fs, t } = useTheme();
  const { signIn, login } = useApp();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");
    if (!username.trim()) {
      setError("Please enter your username (Registration No)");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn(username.trim(), password.trim());
      if (!result) {
        setError("Invalid username or password. Please try again.");
        return;
      }
      if (!result.registrations || result.registrations.length === 0) {
        setError("No active registration found for this account. Please contact the factory.");
        return;
      }
      if (result.registrations.length > 1) {
        router.push("/(auth)/select-account");
      } else {
        await login(result.registrations[0]);
        router.replace("/(app)/home");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardView>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Section ─────────────────────────────────── */}
          <View style={{
            backgroundColor: colors.primary,
            paddingTop: 56,
            paddingBottom: 90,
            paddingHorizontal: 24,
            alignItems: "center",
            borderBottomLeftRadius: 44,
            borderBottomRightRadius: 44,
            overflow: "hidden",
          }}>
            {/* Decorative circles */}
            <View style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.07)" }} />
            <View style={{ position: "absolute", top: 30, right: 20, width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.06)" }} />
            <View style={{ position: "absolute", bottom: 10, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.06)" }} />
            <View style={{ position: "absolute", bottom: 40, right: -10, width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.05)" }} />

            {/* App Icon */}
            <View style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.25)",
            }}>
              <Text style={{ fontSize: 50 }}>🍃</Text>
            </View>

            <Text style={{
              fontSize: fs["3xl"],
              fontWeight: "900",
              color: "#fff",
              letterSpacing: 0.5,
              textAlign: "center",
            }}>
              Tea Factory
            </Text>
            <Text style={{
              fontSize: fs.sm,
              color: "rgba(255,255,255,0.72)",
              marginTop: 6,
              letterSpacing: 0.3,
              textAlign: "center",
            }}>
              Supplier Management Portal
            </Text>
          </View>

          {/* ── Login Card ───────────────────────────────────── */}
          <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 28, marginTop: -44 }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 28,
              padding: 26,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.14,
              shadowRadius: 28,
              elevation: 10,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}>
              {/* Card Header */}
              <Text style={{ fontSize: fs.xl, fontWeight: "800", color: colors.text }}>
                Welcome Back 👋
              </Text>
              <Text style={{ fontSize: fs.sm, color: colors.textSecondary, marginTop: 4, marginBottom: 26 }}>
                Sign in to your supplier account
              </Text>

              {/* Username */}
              <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 8 }}>
                {t.username}
              </Text>
              <Field
                icon="person-outline"
                placeholder="Enter your username"
                value={username}
                onChangeText={(v) => { setUsername(v); setError(""); }}
                hasError={!!error}
              />

              {/* Password */}
              <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
                {t.password}
              </Text>
              <Field
                icon="lock-closed-outline"
                placeholder="Enter your password"
                value={password}
                onChangeText={(v) => { setPassword(v); setError(""); }}
                secureTextEntry={!showPassword}
                hasError={!!error}
                right={
                  <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={fs.lg}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />

              {/* Error */}
              {!!error && (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 12,
                  backgroundColor: colors.error + "12",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}>
                  <Ionicons name="alert-circle" size={fs.base} color={colors.error} />
                  <Text style={{ color: colors.error, fontSize: fs.sm, flex: 1 }}>{error}</Text>
                </View>
              )}

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleSignIn}
                disabled={loading}
                activeOpacity={0.85}
                style={{
                  marginTop: 22,
                  backgroundColor: loading ? colors.disabled : colors.primary,
                  borderRadius: 14,
                  paddingVertical: 15,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                {loading ? (
                  <>
                    <Ionicons name="sync-outline" size={fs.md} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: fs.md }}>
                      Signing in...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: fs.md }}>
                      {t.signIn}
                    </Text>
                    <Ionicons name="arrow-forward" size={fs.md} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}
