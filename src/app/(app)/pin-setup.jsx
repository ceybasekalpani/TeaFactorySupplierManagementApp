import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function PinSetupScreen() {
  const { colors, fs } = useTheme();
  // registrations and token come from AppContext state set during signIn
  const { setupPin, login, registrations } = useApp();
  const router = useRouter();

  const [step, setStep] = useState("enter"); // "enter" | "confirm"
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePress = (key) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    setError("");
    if (next.length === PIN_LENGTH) {
      setTimeout(() => advance(next), 120);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const advance = async (entered) => {
    if (step === "enter") {
      setFirstPin(entered);
      setPin("");
      setStep("confirm");
    } else {
      if (entered !== firstPin) {
        Vibration.vibrate(300);
        setError("PINs do not match. Try again.");
        setPin("");
        setStep("enter");
        setFirstPin("");
        return;
      }
      setLoading(true);
      try {
        // Save PIN server-side (uses the token already stored in AppContext)
        await setupPin(entered);

        // Navigate based on how many registrations exist
        if (registrations.length > 1) {
          router.replace("/(auth)/select-account");
        } else if (registrations.length === 1) {
          // login() will load settings + app data and set authState → "authenticated"
          await login(registrations[0]);
          router.replace("/(app)/home");
        } else {
          router.replace("/(app)/home");
        }
      } catch (err) {
        Vibration.vibrate(300);
        setError(err.message || "Failed to save PIN. Try again.");
        setPin("");
        setStep("enter");
        setFirstPin("");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>

        {/* Icon */}
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: colors.primary + "18",
          alignItems: "center", justifyContent: "center",
          marginBottom: 20,
        }}>
          <Ionicons name="keypad-outline" size={38} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={{ fontSize: fs["2xl"], fontWeight: "800", color: colors.text, textAlign: "center" }}>
          {step === "enter" ? "Create Your PIN" : "Confirm Your PIN"}
        </Text>
        <Text style={{ fontSize: fs.sm, color: colors.textSecondary, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
          {step === "enter"
            ? "Set a 4-digit PIN for quick access next time"
            : "Re-enter your PIN to confirm"}
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

        {/* Step indicator */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 28 }}>
          {["enter","confirm"].map((s) => (
            <View key={s} style={{
              width: step === s ? 20 : 8, height: 8, borderRadius: 4,
              backgroundColor: step === s ? colors.primary : colors.border,
            }} />
          ))}
        </View>

        {/* Number pad */}
        {loading ? (
          <Text style={{ color: colors.textSecondary, fontSize: fs.sm }}>Saving PIN...</Text>
        ) : (
          <NumPad onPress={handlePress} onDelete={handleDelete} />
        )}
      </View>
    </SafeAreaView>
  );
}