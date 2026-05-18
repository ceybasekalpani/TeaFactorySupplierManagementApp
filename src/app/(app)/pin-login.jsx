import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const PIN_LENGTH = 4;

function PinDots({ value, hasError }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 18, justifyContent: "center", marginVertical: 28 }}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: i < value.length
              ? (hasError ? colors.error : colors.primary)
              : "transparent",
            borderWidth: 2,
            borderColor: hasError ? colors.error : (i < value.length ? colors.primary : colors.border),
          }}
        />
      ))}
    </View>
  );
}

function NumPad({ onPress, onDelete }) {
  const { colors, fs } = useTheme();
  const keys = ["1","2","3","4","5","6","7","8","9","","0","del"];

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", width: 270, gap: 16, justifyContent: "center" }}>
      {keys.map((key, i) => {
        if (key === "") return <View key={i} style={{ width: 74 }} />;
        const isDel = key === "del";
        return (
          <TouchableOpacity
            key={i}
            onPress={() => isDel ? onDelete() : onPress(key)}
            activeOpacity={0.7}
            style={{
              width: 74, height: 74, borderRadius: 37,
              backgroundColor: isDel ? "transparent" : colors.card,
              alignItems: "center", justifyContent: "center",
              borderWidth: isDel ? 0 : 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDel ? 0 : 0.06,
              shadowRadius: 4,
              elevation: isDel ? 0 : 2,
            }}
          >
            {isDel ? (
              <Ionicons name="backspace-outline" size={26} color={colors.textSecondary} />
            ) : (
              <Text style={{ fontSize: fs["2xl"], fontWeight: "500", color: colors.text }}>{key}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function PinLoginScreen() {
  const { colors, fs } = useTheme();
  const { savedRegNo, savedName, pinLogin, login } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Retrieve params if forwarded from landing, otherwise use saved context 
  const activeRegNo = params.regNo || savedRegNo;
  const displayName = params.name || savedName || "User";
  
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const handlePress = (key) => {
    if (pin.length >= PIN_LENGTH || loading) return;
    const next = pin + key;
    setPin(next);
    setError("");

    if (next.length === PIN_LENGTH) {
      setTimeout(() => submitPin(next), 120);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const submitPin = async (entered) => {
    if (!activeRegNo) return;
    setLoading(true);
    try {
      const result = await pinLogin(activeRegNo, entered);
      if (!result) {
        Vibration.vibrate(300);
        setError("Wrong PIN. Please try again.");
        setPin("");
        setLoading(false);
        return;
      }
      const regs = result.registrations;
      if (regs.length > 1) {
        router.replace("/(auth)/select-account");
      } else if (regs.length === 1) {
        await login(regs[0], result.token); 
        router.replace("/(app)/home");
      } else {
        router.replace("/(app)/home");
      }
    } catch (err) {
      Vibration.vibrate(300);
      setError(err.message || "Wrong PIN. Please try again.");
      setPin("");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>

        {/* Avatar */}
        <View style={{
          width: 84, height: 84, borderRadius: 42,
          backgroundColor: colors.primary,
          alignItems: "center", justifyContent: "center",
          marginBottom: 16,
          borderWidth: 3, borderColor: colors.primary + "40",
        }}>
          <Text style={{ fontSize: 32, fontWeight: "700", color: "#fff" }}>
            {initials || "?"}
          </Text>
        </View>

        {/* Greeting */}
        <Text style={{ fontSize: fs.sm, color: colors.textSecondary, marginBottom: 2 }}>
          Welcome back
        </Text>
        <Text style={{ fontSize: fs["2xl"], fontWeight: "800", color: colors.text, textAlign: "center" }}>
          {displayName}
        </Text>
        <Text style={{ fontSize: fs.sm, color: colors.textMuted, marginTop: 6 }}>
          Enter your PIN to continue
        </Text>

        {/* Dots */}
        <PinDots value={pin} hasError={!!error} />

        {/* Error */}
        {!!error && (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: colors.error + "14", borderRadius: 10,
            paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16,
          }}>
            <Ionicons name="alert-circle" size={fs.base} color={colors.error} />
            <Text style={{ color: colors.error, fontSize: fs.sm }}>{error}</Text>
          </View>
        )}

        {/* Number pad */}
        {loading ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: colors.textSecondary, fontSize: fs.sm }}>Verifying...</Text>
          </View>
        ) : (
          <>
            <NumPad onPress={handlePress} onDelete={handleDelete} />

            {/* PIN Reset Route */}
            <TouchableOpacity
              onPress={() => router.replace({ pathname: "/(auth)/landing", params: { reset: "true" } })}
              style={{ marginTop: 32, paddingVertical: 8, paddingHorizontal: 16 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "600" }}>
                Forgot / Reset PIN?
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}